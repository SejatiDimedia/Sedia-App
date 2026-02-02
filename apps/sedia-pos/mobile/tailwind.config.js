/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#edf7f7",
          100: "#dbefef",
          200: "#b8dfdf",
          300: "#94d0cf",
          400: "#5fb9b7",
          500: "#377f7e", // Deep Teal (Main Brand)
          600: "#2e6a69",
          700: "#255554",
          800: "#1b3f3f",
          900: "#122a2a",
          950: "#091515",
        },
        secondary: {
          50: "#fefbf5",
          100: "#fdf7e6",
          200: "#fbe8b6",
          300: "#f8d985",
          400: "#f6cc5e",
          500: "#f5c23c", // Gold (Accent)
          600: "#f2b30c",
          700: "#c28f09",
          800: "#916b07",
          900: "#614704",
          950: "#302302",
        },
        zinc: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#09090b",
        },
      },
    },
  },
  plugins: [],
};
