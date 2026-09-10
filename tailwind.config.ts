import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Healthcare Color System
        primary: {
          DEFAULT: "#0891B2", // cyan-600
          foreground: "#FFFFFF",
          light: "#22D3EE", // cyan-400
          dark: "#0E7490", // cyan-700
        },
        secondary: {
          DEFAULT: "#22D3EE", // cyan-400
          foreground: "#164E63",
        },
        accent: {
          DEFAULT: "#059669", // emerald-600
          foreground: "#FFFFFF",
          light: "#10B981", // emerald-500
          dark: "#047857", // emerald-700
        },
        background: {
          DEFAULT: "#ECFEFF", // cyan-50
          dark: "#0C1821",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#0F2027",
        },
        muted: {
          DEFAULT: "#CFFAFE", // cyan-100
          foreground: "#155E75", // cyan-800
          dark: "#164E63",
        },
        border: {
          DEFAULT: "#A5F3FC", // cyan-200
          dark: "#0E7490",
        },
        // Healthcare specific
        "text-primary": "#164E63", // cyan-900
        "text-secondary": "#0E7490", // cyan-700
        highlight: "#059669", // emerald-600
        "cta-button": "#059669",
        "regular-button": "#0891B2",
        contrast: "#059669",
        // shadcn/ui compatibility
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        foreground: "hsl(var(--foreground))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        display: ["var(--font-figtree)", "sans-serif"],
        body: ["var(--font-noto-sans)", "sans-serif"],
        heading: ["var(--font-figtree)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["clamp(4rem, 15vw, 12rem)", { lineHeight: "0.9", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(3rem, 10vw, 8rem)", { lineHeight: "0.95", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(2rem, 6vw, 4rem)", { lineHeight: "1", letterSpacing: "-0.01em" }],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-in-left": "slideInLeft 0.6s ease-out",
        "slide-in-right": "slideInRight 0.6s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-30px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(30px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        none: "0px",
      },
      boxShadow: {
        "medical": "0 4px 6px -1px rgba(8, 145, 178, 0.1), 0 2px 4px -2px rgba(8, 145, 178, 0.1)",
        "medical-lg": "0 10px 15px -3px rgba(8, 145, 178, 0.1), 0 4px 6px -4px rgba(8, 145, 178, 0.1)",
        "medical-accent": "0 4px 6px -1px rgba(5, 150, 105, 0.2), 0 2px 4px -2px rgba(5, 150, 105, 0.1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
