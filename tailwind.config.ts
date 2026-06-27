import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#191714",
        paper: "#fbfaf7",
        ivory: "#f2eee7",
        line: "#e7e0d6",
        gold: "#b58b42",
        clay: "#9d6a5f",
        moss: "#65735f"
      },
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"]
      }
    }
  },
  plugins: []
};

export default config;