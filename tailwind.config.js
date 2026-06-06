/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
      },
      boxShadow: {
        glow: "0 0 40px rgba(59,130,246,0.35)",
      },
    },
  },
  plugins: [],
};