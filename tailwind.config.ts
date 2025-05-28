import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./apps/web/client/index.html",
    "./apps/web/client/src/**/*.{js,jsx,ts,tsx}",
    "./packages/ui/src/**/*.{js,jsx,ts,tsx}",
    "./packages/shared-components/src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        'safe': 'env(safe-area-inset-bottom)',
      },
      height: {
        'screen': '100vh',
        'screen-dynamic': '100dvh',
        'touch': '44px',
      },
      minHeight: {
        'screen': '100vh',
        'screen-dynamic': '100dvh',
        'touch': '44px',
      },
      maxHeight: {
        'screen': '100vh',
        'screen-dynamic': '100dvh',
      },
      width: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        'card-foreground': "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        'popover-foreground': "hsl(var(--popover-foreground))",
        primary: "hsl(var(--primary))",
        'primary-foreground': "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        'secondary-foreground': "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        'muted-foreground': "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        'accent-foreground': "hsl(var(--accent-foreground))",
        destructive: "hsl(var(--destructive))",
        'destructive-foreground': "hsl(var(--destructive-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Chart colors
        'chart-1': "hsl(var(--chart-1))",
        'chart-2': "hsl(var(--chart-2))",
        'chart-3': "hsl(var(--chart-3))",
        'chart-4': "hsl(var(--chart-4))",
        'chart-5': "hsl(var(--chart-5))",
        // Sidebar colors
        'sidebar-background': "hsl(var(--sidebar-background))",
        'sidebar-foreground': "hsl(var(--sidebar-foreground))",
        'sidebar-primary': "hsl(var(--sidebar-primary))",
        'sidebar-primary-foreground': "hsl(var(--sidebar-primary-foreground))",
        'sidebar-accent': "hsl(var(--sidebar-accent))",
        'sidebar-accent-foreground': "hsl(var(--sidebar-accent-foreground))",
        'sidebar-border': "hsl(var(--sidebar-border))",
        'sidebar-ring': "hsl(var(--sidebar-ring))",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
  safelist: [
    'bg-background',
    'text-foreground',
    'border-[hsl(var(--border))]',
  ],
} satisfies Config;