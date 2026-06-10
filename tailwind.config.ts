import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        gold: { 400: "#C9A84C", 300: "#E2CF96" },
        navy: { 950: "#020818", 900: "#060E2A", 800: "#0B1640" },
        cream: { 50: "#FDFCF8", 100: "#F9F7F0", 200: "#F3EFE4", 300: "#E8E1D0" },
      },
    },
  },
  plugins: [],
};
export default config;
