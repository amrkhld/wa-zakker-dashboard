/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Somar Sans'", "sans-serif"],
      },
      colors: {
        primary: "#11538C",
        secondary: "#398CBF",
        soft: "#9AC1D9",
        surface: "#F2F2F2",
        danger: "#ed5e5e",
      },
      borderRadius: {
        pill: "22px",
      },
    },
  },
  plugins: [],
};
