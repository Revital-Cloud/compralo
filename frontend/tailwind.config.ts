// tailwind.config.ts
const {heroui} = require("@heroui/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/components/image.js",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [heroui(), require('@tailwindcss/line-clamp')],
};