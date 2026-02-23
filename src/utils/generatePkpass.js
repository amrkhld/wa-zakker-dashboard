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
  /* 1. Build pass.json */
  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: PASS_TYPE_IDENTIFIER,
    serialNumber: card.id,
    teamIdentifier: TEAM_IDENTIFIER,
    organizationName: ORG_NAME,
    description: card.title,
    foregroundColor: "rgb(255, 255, 255)",
    backgroundColor: hexToRgb(card.color),
    labelColor: "rgb(200, 200, 200)",
    generic: {
      headerFields: [
        {
          key: "title",
          label: "",
          value: card.title,
          textAlignment: "PKTextAlignmentNatural",
        },
      ],
      primaryFields: [
        {
          key: "dhikr",
          label: "",
          value: card.dhikr,
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
          key: "category",
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

  /* 3. Prepare logo images (displayed on the pass, top-left) */
  const originalLogo = await fetchBinary("/logo-flat-white-pass.png");
  const logo1x = await resizeImage(originalLogo, 50, 50);
  const logo2x = await resizeImage(originalLogo, 100, 100);
  const logo3x = await resizeImage(originalLogo, 150, 150);

  /* 4. Collect all pass files as Uint8Array so hashing and zipping use identical bytes */
  const encoder = new TextEncoder();
  const files = {
    "pass.json": encoder.encode(passJsonStr),
    "icon.png": new Uint8Array(icon1x),
    "icon@2x.png": new Uint8Array(icon2x),
    "icon@3x.png": new Uint8Array(icon3x),
    "logo.png": new Uint8Array(logo1x),
    "logo@2x.png": new Uint8Array(logo2x),
    "logo@3x.png": new Uint8Array(logo3x),
  };

  /* 5. Build manifest.json (SHA-1 hash of every file's actual bytes) */
  const manifest = {};
  for (const [name, data] of Object.entries(files)) {
    manifest[name] = sha1Hex(data);
  }
  const manifestStr = JSON.stringify(manifest);

  /* 6. Sign the manifest */
  const signatureDer = signManifest(manifestStr);

  /* 7. Package everything into a ZIP (.pkpass) */
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
