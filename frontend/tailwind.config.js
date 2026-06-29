/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        base: "#0A0A0A",
        surface: "#121212",
        "surface-hover": "#18181B",
        volt: "#007AFF",
        "volt-hover": "#3B82F6",
      },
      fontFamily: {
        sans: ["Outfit", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
      },
      animation: {
        blink: "blink 1s step-end infinite",
        shake: "shake 0.2s ease-in-out",
      },
    },
  },
  plugins: [],
};
