import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          500: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63"
        }
      }
    }
  },
  plugins: []
};

export default config;
