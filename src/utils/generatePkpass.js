import JSZip from "jszip";
import forge from "node-forge";

/* ─── Apple Wallet pass credentials (from dhikr cert/info.json) ─── */
const TEAM_IDENTIFIER = "D6GJ37W6QP";
const PASS_TYPE_IDENTIFIER = "pass.com.wadhakar";
const ORG_NAME = "وذكّر";

/* ─── Certificates from .env ─── */
const P12_BASE64 = import.meta.env.VITE_P12_BASE64;
const P12_PASSWORD = import.meta.env.VITE_P12_PASSWORD;

// WWDR PEM is stored as base64-encoded PEM text to avoid newline issues in .env
const WWDR_PEM = (() => {
  const b64 = import.meta.env.VITE_WWDR_PEM_BASE64 || "";
  try {
    return atob(b64);
  } catch {
    return "";
  }
})();

/**
 * Convert hex color (#RRGGBB) to "rgb(r, g, b)" for Apple Wallet
 */
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * SHA-1 hash of a Uint8Array (returns hex string).
 * Converts to a binary string so node-forge processes each byte correctly,
 * avoiding corruption of multi-byte UTF-8 characters (e.g. Arabic text).
 */
function sha1Hex(bytes) {
  const md = forge.md.sha1.create();
  // Convert Uint8Array to a binary string where each char is one byte (0-255)
  let binStr = "";
  for (let i = 0; i < bytes.length; i++) {
    binStr += String.fromCharCode(bytes[i]);
  }
  md.update(binStr, "raw");
  return md.digest().toHex();
}

/**
 * Fetch a file from a URL and return as ArrayBuffer
 */
async function fetchBinary(url) {
  const res = await fetch(url);
  return res.arrayBuffer();
}

/**
 * Resize an image to target dimensions using an offscreen canvas.
 * Returns a PNG ArrayBuffer.
 */
async function resizeImage(arrayBuffer, targetWidth, targetHeight) {
  const blob = new Blob([arrayBuffer], { type: "image/png" });
  const bitmap = await createImageBitmap(blob, {
    resizeWidth: targetWidth,
    resizeHeight: targetHeight,
    resizeQuality: "high",
  });
  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0);
  const outBlob = await canvas.convertToBlob({ type: "image/png" });
  return outBlob.arrayBuffer();
}

/**
 * Parse hex color (#RRGGBB) to { r, g, b }
 */
function parseHex(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

/**
 * Render the dhikr text into a strip image at Apple's EXACT allowed
 * dimensions (375 × 123 pt). iOS clips anything taller, so we
 * never exceed this height.
 *
 * Strategy:
 *  1. Auto-size font from MAX → MIN to fit as many lines as possible.
 *  2. If text still overflows at MIN font, render only the lines that
 *     fit — full text is always available on the back of the pass.
 *  3. The canvas is exactly 1125 × 369 px (375 × 123 pt @3×).
 *     Nothing is cropped because the image matches Apple's spec.
 *
 * @param {string} text - Full dhikr text
 * @param {string} hex  - Brand hex color (#RRGGBB)
 * @returns {Promise<ArrayBuffer>} - PNG buffer at @3× (1125 × 369)
 */
async function renderDhikrStrip(text, hex) {
  const SCALE = 3;
  const PT_W = 375;
  const PT_H = 123;          // Apple's storeCard strip height — FIXED
  const PX_W = PT_W * SCALE; // 1125
  const PX_H = PT_H * SCALE; // 369

  const { r, g, b } = parseHex(hex);

  /* ── Design tokens (pt) ── */
  const PAD_TOP_PT   = 14;
  const PAD_BOT_PT   = 14;
  const PAD_X_PT     = 28;
  const BOX_PAD_X_PT = 14;
  const BOX_PAD_Y_PT = 14;
  const BOX_RADIUS_PT = 14;
  const MAX_FONT_PT  = 16;
  const MIN_FONT_PT  = 9;

  const fontFamily = '"Geeza Pro", "Segoe UI", "SF Arabic", Arial, sans-serif';
  const maxTextW = PX_W - (PAD_X_PT + BOX_PAD_X_PT) * 2 * SCALE;

  /* ── Word-wrap helper ── */
  function measureLines(fontPt) {
    const fontPx = fontPt * SCALE;
    const tmp = new OffscreenCanvas(PX_W, 100);
    const tCtx = tmp.getContext("2d");
    tCtx.font = `500 ${fontPx}px ${fontFamily}`;
    tCtx.direction = "rtl";
    const words = text.split(/\s+/).filter(Boolean);
    const result = [];
    let cur = words[0] || "";
    for (let i = 1; i < words.length; i++) {
      const test = cur + " " + words[i];
      if (tCtx.measureText(test).width > maxTextW) {
        result.push(cur);
        cur = words[i];
      } else {
        cur = test;
      }
    }
    if (cur) result.push(cur);
    return result;
  }

  /* ── How many lines fit at a given font size ── */
  function maxVisibleLines(fontPt) {
    const lineHPt = Math.round(fontPt * 1.8);
    const usable = PT_H - PAD_TOP_PT - PAD_BOT_PT - BOX_PAD_Y_PT * 2;
    return Math.floor(usable / lineHPt);
  }

  /* ── Pick best font: largest where ALL lines fit.
        If even MIN_FONT can't fit all, use MIN_FONT and show what fits. ── */
  let fontPt = MAX_FONT_PT;
  let lines = measureLines(fontPt);
  for (; fontPt > MIN_FONT_PT; fontPt--) {
    lines = measureLines(fontPt);
    if (lines.length <= maxVisibleLines(fontPt)) break;
  }
  fontPt = Math.max(fontPt, MIN_FONT_PT);
  lines = measureLines(fontPt);

  const lineHPt = Math.round(fontPt * 1.8);
  const maxLines = maxVisibleLines(fontPt);
  const visibleLines = lines.slice(0, maxLines);

  /* ── Scale to px ── */
  const padTop  = PAD_TOP_PT * SCALE;
  const padX    = PAD_X_PT * SCALE;
  const boxPadX = BOX_PAD_X_PT * SCALE;
  const boxPadY = BOX_PAD_Y_PT * SCALE;
  const boxRadius = BOX_RADIUS_PT * SCALE;
  const fontPx  = fontPt * SCALE;
  const lineH   = lineHPt * SCALE;

  /* ── Draw on FIXED-SIZE canvas ── */
  const canvas = new OffscreenCanvas(PX_W, PX_H);
  const ctx = canvas.getContext("2d");

  // White background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, PX_W, PX_H);

  // Tinted rounded box (fills most of the strip)
  const boxX = padX;
  const boxY = padTop;
  const boxW = PX_W - padX * 2;
  const boxH = PX_H - padTop - PAD_BOT_PT * SCALE;

  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.04)`;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, boxRadius);
  ctx.fill();

  // Dhikr text (RTL, right-aligned)
  ctx.fillStyle = hex;
  ctx.font = `500 ${fontPx}px ${fontFamily}`;
  ctx.textAlign = "right";
  ctx.direction = "rtl";
  ctx.textBaseline = "top";

  let y = boxY + boxPadY;
  for (const line of visibleLines) {
    ctx.fillText(line, boxX + boxW - boxPadX, y);
    y += lineH;
  }

  const blob = await canvas.convertToBlob({ type: "image/png" });
  return blob.arrayBuffer();
}

/**
 * Create the PKCS#7 detached signature for the manifest.
 * Returns the DER-encoded signature as a binary string.
 */
function signManifest(manifestJson) {
  // Decode the .p12
  const p12Der = forge.util.decode64(P12_BASE64);
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, P12_PASSWORD);

  // Extract private key
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag =
    keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0] ||
    Object.values(keyBags).flat().find((b) => b?.key);
  if (!keyBag) throw new Error("No private key found in .p12");
  const privateKey = keyBag.key;

  // Extract signer certificate
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const signerCert =
    certBags[forge.pki.oids.certBag]?.[0]?.cert ||
    Object.values(certBags).flat().find((b) => b?.cert)?.cert;
  if (!signerCert) throw new Error("No certificate found in .p12");

  // Try to parse WWDR intermediate certificate (may fail if it uses EC keys)
  let wwdrCert = null;
  if (WWDR_PEM) {
    try {
      wwdrCert = forge.pki.certificateFromPem(WWDR_PEM);
    } catch (e) {
      // WWDR cert uses EC (not RSA) — node-forge can't parse it.
      // iOS already has the WWDR intermediates in its trust store, so this is OK.
      console.warn("WWDR cert is EC-based, skipping inclusion in PKCS#7 (iOS has it built-in).");
    }
  }

  // Create PKCS#7 signed data (detached signature)
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(manifestJson, "utf8");

  // Add certificates to the bundle
  p7.addCertificate(signerCert);
  if (wwdrCert) {
    p7.addCertificate(wwdrCert);
  }

  // Add signer
  p7.addSigner({
    key: privateKey,
    certificate: signerCert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      {
        type: forge.pki.oids.contentType,
        value: forge.pki.oids.data,
      },
      {
        type: forge.pki.oids.messageDigest,
      },
      {
        type: forge.pki.oids.signingTime,
        value: new Date(),
      },
    ],
  });

  // Sign
  p7.sign({ detached: true });

  // Encode to DER
  const asn1 = p7.toAsn1();
  const der = forge.asn1.toDer(asn1);
  return der.getBytes(); // binary string
}

/**
 * Generate a fully signed .pkpass bundle from a dhikr card.
 *
 * @param {Object} card - The dhikr card object
 * @param {string} card.id - Unique identifier
 * @param {string} card.title - Card title
 * @param {string} card.category - Category label
 * @param {string} card.dhikr - The dhikr text
 * @param {string} card.color - Hex color string
 * @returns {Promise<Blob>} - The signed .pkpass file as a Blob
 */
export async function generatePkpass(card) {
  /* 1. Build pass.json — storeCard with strip image for dhikr text.
        Title is in headerFields; full dhikr on back of pass. */
  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: PASS_TYPE_IDENTIFIER,
    serialNumber: card.id,
    teamIdentifier: TEAM_IDENTIFIER,
    organizationName: ORG_NAME,
    description: card.title,
    logoText: "وَذَكِّرْ",
    foregroundColor: hexToRgb(card.color),
    backgroundColor: "rgb(255, 255, 255)",
    labelColor: hexToRgb(card.color),
    storeCard: {
      headerFields: [
        {
          key: "title",
          label: "الذكر",
          value: card.title,
        },
      ],
      secondaryFields: [
        {
          key: "category",
          label: card.category || "",
          value: " ",
          textAlignment: "PKTextAlignmentRight",
        },
      ],
      backFields: [
        {
          key: "dhikrName",
          label: "الذكر",
          value: card.title,
        },
        {
          key: "fullDhikr",
          label: "نص الذكر",
          value: card.dhikr,
        },
        {
          key: "categoryBack",
          label: "التصنيف",
          value: card.category || "",
        },
        {
          key: "app",
          label: "التطبيق",
          value: "وذكّر - wa-zakker",
        },
      ],
    },
  };

  const passJsonStr = JSON.stringify(passJson);

  /* 2. Prepare icon images (notification icon) */
  const originalIcon = await fetchBinary("/icon.png");
  const icon1x = await resizeImage(originalIcon, 29, 29);
  const icon2x = await resizeImage(originalIcon, 58, 58);
  const icon3x = await resizeImage(originalIcon, 87, 87);

  /* 3. Prepare logo images (symbol in the header, next to logoText) */
  const originalSymbol = await fetchBinary("/symbol-pass-bg-transparent.png");
  const logo1x = await resizeImage(originalSymbol, 50, 50);
  const logo2x = await resizeImage(originalSymbol, 100, 100);
  const logo3x = await resizeImage(originalSymbol, 150, 150);

  /* 4. Prepare footer images (brand logo at bottom of pass, above barcode area) */
  const originalFooterLogo = await fetchBinary("/logo-pass-bg-transparent.png");
  // Determine aspect ratio to compute proper height
  const footerBlob = new Blob([originalFooterLogo], { type: "image/png" });
  const footerBitmap = await createImageBitmap(footerBlob);
  const footerAspect = footerBitmap.width / footerBitmap.height;
  // Footer max width = 286pt. Calculate height preserving aspect ratio.
  const FOOTER_W_1X = 286;
  const FOOTER_H_1X = Math.round(FOOTER_W_1X / footerAspect);
  const footer1x = await resizeImage(originalFooterLogo, FOOTER_W_1X, FOOTER_H_1X);
  const footer2x = await resizeImage(originalFooterLogo, FOOTER_W_1X * 2, FOOTER_H_1X * 2);
  const footer3x = await resizeImage(originalFooterLogo, FOOTER_W_1X * 3, FOOTER_H_1X * 3);

  /* 5. Render dhikr strip at exact Apple dimensions (375×123 pt @3×) */
  const strip3xBuf = await renderDhikrStrip(card.dhikr, card.color);
  const strip2x = await resizeImage(strip3xBuf, 375 * 2, 123 * 2);
  const strip1x = await resizeImage(strip3xBuf, 375, 123);

  /* 6. Collect all pass files as Uint8Array so hashing and zipping use identical bytes */
  const encoder = new TextEncoder();
  const files = {
    "pass.json": encoder.encode(passJsonStr),
    "icon.png": new Uint8Array(icon1x),
    "icon@2x.png": new Uint8Array(icon2x),
    "icon@3x.png": new Uint8Array(icon3x),
    "logo.png": new Uint8Array(logo1x),
    "logo@2x.png": new Uint8Array(logo2x),
    "logo@3x.png": new Uint8Array(logo3x),
    "footer.png": new Uint8Array(footer1x),
    "footer@2x.png": new Uint8Array(footer2x),
    "footer@3x.png": new Uint8Array(footer3x),
    "strip.png": new Uint8Array(strip1x),
    "strip@2x.png": new Uint8Array(strip2x),
    "strip@3x.png": new Uint8Array(strip3xBuf),
  };

  /* 7. Build manifest.json (SHA-1 hash of every file's actual bytes) */
  const manifest = {};
  for (const [name, data] of Object.entries(files)) {
    manifest[name] = sha1Hex(data);
  }
  const manifestStr = JSON.stringify(manifest);

  /* 8. Sign the manifest */
  const signatureDer = signManifest(manifestStr);

  /* 9. Package everything into a ZIP (.pkpass) */
  const zip = new JSZip();
  for (const [name, data] of Object.entries(files)) {
    zip.file(name, data);
  }
  zip.file("manifest.json", manifestStr);
  zip.file("signature", signatureDer, { binary: true });

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.apple.pkpass",
  });

  return blob;
}
