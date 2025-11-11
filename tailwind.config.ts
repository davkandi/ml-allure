import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ML Allure Elegant Fashion Brand Colors
        brand: {
          rose: {
            50: '#fdf2f4',
            100: '#fce7eb',
            200: '#f9d0d9',
            300: '#f5a8b8',
            400: '#ee7891',
            500: '#e1406b',
            600: '#cd2357',
            700: '#ac1848',
            800: '#8f1742',
            900: '#7a173d',
          },
          champagne: {
            50: '#fdfbf7',
            100: '#faf6ed',
            200: '#f5ebd2',
            300: '#eedcb0',
            400: '#e5c786',
            500: '#ddb163',
            600: '#d19b4f',
            700: '#b17d42',
            800: '#8e643a',
            900: '#735332',
          },
          burgundy: {
            50: '#fdf4f5',
            100: '#fbe8ea',
            200: '#f8d5d9',
            300: '#f1b3bc',
            400: '#e78799',
            500: '#d75d78',
            600: '#c23c5e',
            700: '#a32d4d',
            800: '#892845',
            900: '#75263f',
          },
          ivory: {
            50: '#fdfcfb',
            100: '#faf8f5',
            200: '#f5f1e9',
            300: '#ede6d7',
            400: '#e0d4bb',
            500: '#d0bd9b',
            600: '#bea17a',
            700: '#a58662',
            800: '#886e54',
            900: '#705c47',
          },
          charcoal: {
            50: '#f6f6f6',
            100: '#e7e7e7',
            200: '#d1d1d1',
            300: '#b0b0b0',
            400: '#888888',
            500: '#6d6d6d',
            600: '#5d5d5d',
            700: '#4f4f4f',
            800: '#454545',
            900: '#3d3d3d',
          },
          gold: {
            50: '#fefce8',
            100: '#fef9c3',
            200: '#fef08a',
            300: '#fde047',
            400: '#facc15',
            500: '#eab308',
            600: '#ca8a04',
            700: '#a16207',
            800: '#854d0e',
            900: '#713f12',
          },
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
