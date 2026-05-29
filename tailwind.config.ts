import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        coconut: {
          bark: "#4A2C1D",
          shell: "#6B3F25",
          brown: "#8B5A2B",
          cream: "#F7E8C8",
          milk: "#FFF8EC",
          leaf: "#1F6B45",
          moss: "#3D7A4E",
          gold: "#C89B3C",
          smoke: "#2A211A"
        }
      },
      boxShadow: {
        premium: "0 24px 80px rgba(75, 44, 29, 0.18)",
        soft: "0 14px 40px rgba(31, 107, 69, 0.12)"
      },
      backgroundImage: {
        woodgrain: "linear-gradient(135deg, rgba(74,44,29,.12) 0%, rgba(255,248,236,.78) 35%, rgba(31,107,69,.1) 100%)"
      }
    }
  },
  plugins: []
};
export default config;
