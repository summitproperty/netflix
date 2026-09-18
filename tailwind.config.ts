import type { Config } from "tailwindcss";

/**
 * Theme tokens live here and in styles/globals.css (CSS variables).
 * Re-brand the whole site by editing the `brand` palette below.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "rgb(var(--brand-rgb) / <alpha-value>)",
          hover: "rgb(var(--brand-hover-rgb) / <alpha-value>)",
          soft: "var(--brand-soft)",
        },
        gold: {
          DEFAULT: "rgb(var(--gold-rgb) / <alpha-value>)",
          hover: "rgb(var(--gold-hover-rgb) / <alpha-value>)",
          soft: "var(--gold-soft)",
        },
        ink: {
          900: "rgb(var(--ink-900-rgb) / <alpha-value>)",
          800: "rgb(var(--ink-800-rgb) / <alpha-value>)",
          700: "rgb(var(--ink-700-rgb) / <alpha-value>)",
          600: "rgb(var(--ink-600-rgb) / <alpha-value>)",
        },
        mist: {
          100: "rgb(var(--mist-100-rgb) / <alpha-value>)",
          300: "rgb(var(--mist-300-rgb) / <alpha-value>)",
          500: "rgb(var(--mist-500-rgb) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 18px 40px -20px rgba(0, 0, 0, 0.9)",
        glow: "0 0 0 1px var(--brand-soft), 0 20px 45px -22px var(--brand)",
      },
      backgroundImage: {
        "hero-fade":
          "linear-gradient(to top, var(--ink-900) 6%, rgba(9,9,11,0.72) 42%, rgba(9,9,11,0.12) 82%)",
        "hero-side":
          "linear-gradient(to right, var(--ink-900) 2%, rgba(9,9,11,0.82) 38%, rgba(9,9,11,0) 78%)",
        "brand-sheen":
          "linear-gradient(120deg, var(--brand) 0%, #ff5a5f 48%, #7f1020 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "fade-in": "fade-in 0.35s ease-out both",
        shimmer: "shimmer 1.6s infinite",
      },
      screens: {
        xs: "440px",
      },
    },
  },
  plugins: [],
};

export default config;
