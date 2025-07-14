// tailwind.config.ts
const {heroui} = require("@heroui/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores principales de Brillo Rosa
        'brillo-rosa': {
          50: 'oklch(0.97 0.02 350)',  // Rosa muy suave
          100: 'oklch(0.95 0.05 350)', // Rosa suave
          200: 'oklch(0.92 0.08 350)', // Rosa claro
          300: 'oklch(0.85 0.12 350)', // Rosa medio
          400: 'oklch(0.8 0.15 350)',  // Rosa vivo
          500: 'oklch(0.75 0.15 350)', // Rosa principal
          600: 'oklch(0.7 0.18 350)',  // Rosa oscuro
          700: 'oklch(0.65 0.18 350)', // Rosa más oscuro
          800: 'oklch(0.6 0.2 350)',   // Rosa profundo
          900: 'oklch(0.55 0.2 350)',  // Rosa muy profundo
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  darkMode: "class",
  plugins: [require("tailwindcss-animate")],
};