import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import animatePlugin from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-vazirmatn)", "system-ui", "-apple-system", ...fontFamily.sans],
        mono: ["ui-monospace", "Cascadia Code", "Source Code Pro", "Menlo", "Consolas", ...fontFamily.mono],
        vazir: ["var(--font-vazirmatn)", ...fontFamily.sans],
      },
      colors: {
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        "background-elevated": "hsl(var(--background-elevated))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsla(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          glow: "hsla(var(--secondary-glow))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          hover: "hsl(var(--card-hover))",
        },
        gold: {
          DEFAULT: "hsl(43 74% 56%)",
          glow: "hsla(43 74% 56% / 0.3)",
          subtle: "hsla(43 74% 56% / 0.1)",
        },
        purple: {
          crm: "hsl(263 70% 60%)",
          glow: "hsla(263 70% 60% / 0.3)",
        },
        success: "hsl(142 71% 45%)",
        warning: "hsl(38 92% 50%)",
        error: "hsl(0 84% 60%)",
        info: "hsl(199 89% 48%)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      boxShadow: {
        card: "0 1px 3px hsla(0 0% 0% / 0.04), 0 1px 2px hsla(0 0% 0% / 0.06)",
        "card-hover": "0 4px 12px hsla(0 0% 0% / 0.1), 0 2px 4px hsla(0 0% 0% / 0.08)",
        modal: "0 25px 50px hsla(0 0% 0% / 0.25)",
        "premium-glow": "0 0 30px hsla(43 74% 56% / 0.2)",
        "gold-glow": "0 0 20px hsla(43 74% 56% / 0.35), 0 0 40px hsla(43 74% 56% / 0.15)",
        "inner-input": "inset 0 1px 2px hsla(0 0% 0% / 0.05)",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, hsl(43 74% 56%), hsl(263 70% 60%))",
        "gradient-gold": "linear-gradient(135deg, hsl(43 74% 56%), hsl(38 92% 50%))",
        "gradient-card-dark": "linear-gradient(135deg, hsl(240 10% 6%), hsl(240 8% 9%))",
        "shimmer": "linear-gradient(90deg, transparent 0%, hsla(43 74% 56% / 0.06) 50%, transparent 100%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-gold": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 10px hsla(43 74% 56% / 0.3)" },
          "50%": { opacity: "0.8", boxShadow: "0 0 25px hsla(43 74% 56% / 0.6)" },
        },
        "border-beam": {
          "100%": { "offset-distance": "100%" },
        },
        "aurora": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "count-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite linear",
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
        "border-beam": "border-beam 4s linear infinite",
        aurora: "aurora 6s ease infinite",
        float: "float 3s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
        "count-up": "count-up 0.4s ease-out",
      },
      spacing: {
        sidebar: "260px",
        "sidebar-collapsed": "64px",
        topbar: "56px",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.32, 0.72, 0, 1)",
        "spring-bounce": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [animatePlugin],
};

export default config;
