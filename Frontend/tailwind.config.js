/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        roboto: ['Roboto', 'Arial', 'sans-serif'],
        lato: ['Lato', 'Arial', 'sans-serif'],
        sans: ['Open Sans', 'Arial', 'sans-serif'], // Add Roboto as the default sans-serif font
      },
    },
  },
  plugins: [require("tailwind-scrollbar-hide")],
  server: {
    proxy: {
      "/uploads": "https://meds4you.in",
    },
  },
}