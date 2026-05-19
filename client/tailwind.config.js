/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#E6EDF3",
        ember: "#FF3366",
        mint: "#00FF66",
        sunrise: "#8B949E",
        obsidian: "#0D1117",
        surface: "#161B22",
        muted: "#8B949E",
        text: "#E6EDF3",
        neon: "#00FF66",
        danger: "#FF3366",
      },
      boxShadow: {
        card: "0 18px 42px rgba(0, 0, 0, 0.32)",
      },
    },
  },
  plugins: [],
};
