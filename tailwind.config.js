/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0E1013",
        surface: "#16191F",
        "surface-hover": "#1D212A",
        border: "#262B35",
        ink: "#F2F3F5",
        muted: "#8A8F9C",
        amber: "#F5A623",
        rose: "#F0729A",
        success: "#4ADE80",
        danger: "#F0575A",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
