/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "!./src/design/**"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'deep-space': '#06060C',
        'electric-gold': '#C9A84C',
        'amethyst': '#5A3ACC',
        'mint': '#38CC88',
      },
    },
  },
  plugins: [],
}
