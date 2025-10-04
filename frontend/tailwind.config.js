/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nasaBlue: "#0B3D91",
        spaceGray: "#0B1020",
      },
    },
  },
  plugins: [],
};