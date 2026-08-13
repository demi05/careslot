import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1A5C52",
          dark: "#124039",
          tint: "#E8F2F0",
        },
        accent: {
          DEFAULT: "#E07B39",
          dark: "#B4611F",
          tint: "#FDEEE3",
        },
        background: "#F8F9FA",
        surface: "#FFFFFF",
        ink: "#2D2D2D",
        muted: "#6B7280",
        border: "#E5E7EB",
        success: {
          DEFAULT: "#16A34A",
          tint: "#DCFCE7",
        },
        warning: {
          DEFAULT: "#B45309",
          tint: "#FEF3C7",
        },
        danger: {
          DEFAULT: "#DC2626",
          tint: "#FEE2E2",
        },
      },
      fontFamily: {
        sans: ["var(--font-work-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp .45s cubic-bezier(0.16,1,0.3,1)",
      },
    },
  },
  plugins: [],
};
export default config;
