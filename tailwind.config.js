/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        flowise: {
          green: {
            DEFAULT: "#2D6A4F",
            dark: "#245C44",
            light: "#40916C",
          },
          cream: "#F7F5F0",
          border: "#E8E4DC",
          bg: "#FAFAF8",
        },
      },
    },
  },
  plugins: [],
};