/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#E6EDF3",
        ember: "#FF3366",
        mint: "#00FFA3",
        cyan: "#00C2FF",
        violet: "#7C3AED",
        obsidian: "#071123",
        surface: "#0f1724",
        muted: "#98A0B3",
        text: "#E6EDF3",
        neon: "#00F5A0",
        danger: "#FF6B8A",
      },
      boxShadow: {
        card: "0 18px 42px rgba(2,6,23,0.6)",
        rim: "0 8px 30px rgba(0,245,160,0.08), inset 0 1px 0 rgba(255,255,255,0.02)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      keyframes: {
        float: {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
          '100%': { transform: 'translateY(0)' },
        },
        rimGlow: {
          '0%': { boxShadow: '0 0 0 rgba(0,0,0,0)' },
          '100%': { boxShadow: '0 0 18px rgba(0,245,160,0.12)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'rim-glow': 'rimGlow 0.6s ease-in-out both',
      },
    },
  },
  plugins: [],
};
