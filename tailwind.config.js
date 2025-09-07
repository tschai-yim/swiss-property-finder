/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx", // Include App.tsx
    "./hooks/**/*.{js,ts,jsx,tsx}", // Include hooks directory
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}