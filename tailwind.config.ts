import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./styles/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "rgba(17, 24, 39, 1)" },
      },
    },
  },
  plugins: [],
};

export default config;
