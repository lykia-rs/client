/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#a5d6a7',
          dark: '#4db6ac',
        },
        background: {
          light: '#ffffff',
          dark: '#1a1a1a',
        },
        surface: {
          light: '#f5f5f5',
          dark: '#2d2d2d',
        },
        border: {
          light: '#e0e0e0',
          dark: '#404040',
        },
      },
    },
  },
  plugins: [],
}
