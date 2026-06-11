import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        steel: "#4c5d6d",
        harbor: "#0e7490",
        moss: "#41734d",
        amberline: "#b7791f",
        signal: "#b42318",
        paper: "#f7f4ee"
      },
      boxShadow: {
        soft: "0 18px 40px rgba(23, 32, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
