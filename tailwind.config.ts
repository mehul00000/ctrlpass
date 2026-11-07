import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    // `tv` targets Android TV / large living-room screens (10-foot UI).
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      tv: "1700px",
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: "#CD1C18", // Primary Red — CTAs, play buttons, active states
          deep: "#9B1313", // Deep Red — gradients, card hover, highlights
          dark: "#38000A", // Dark Burgundy — main background
          peach: "#FFA896", // Peach — secondary accents, badges, highlights
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(to top, #38000A 0%, rgba(56,0,10,0.85) 30%, rgba(56,0,10,0.25) 65%, rgba(56,0,10,0.1) 100%)",
        "card-gradient":
          "linear-gradient(to top, rgba(56,0,10,0.95) 0%, rgba(155,19,19,0.35) 60%, rgba(56,0,10,0.1) 100%)",
        "brand-gradient": "linear-gradient(135deg, #CD1C18 0%, #9B1313 100%)",
      },
      boxShadow: {
        card: "0 8px 30px rgba(0,0,0,0.45)",
        "card-hover": "0 16px 48px rgba(205,28,24,0.25)",
        glow: "0 0 24px rgba(205,28,24,0.4)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        fadeUp: "fadeUp 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
