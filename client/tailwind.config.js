/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        ember: "#f97316",
        mint: "#14b8a6",
        sunrise: "#f59e0b",
      },
      boxShadow: {
        card: "0 14px 36px rgba(17, 24, 39, 0.12)",
      },
    },
  },
  plugins: [],
};
