/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: { inter: ['var(--font-inter)'] },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))', '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))', '4': 'hsl(var(--chart-4))', '5': 'hsl(var(--chart-5))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        edu: {
          blue: 'hsl(var(--edu-blue))',
          green: 'hsl(var(--edu-green))',
          amber: 'hsl(var(--edu-amber))',
          rose: 'hsl(var(--edu-rose))',
          purple: 'hsl(var(--edu-purple))',
          cyan: 'hsl(var(--edu-cyan))',
        }
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'float': { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-8px)' } },
        'pulse-ring': { '0%': { boxShadow: '0 0 0 0 hsl(var(--primary)/0.4)' }, '70%': { boxShadow: '0 0 0 10px hsl(var(--primary)/0)' }, '100%': { boxShadow: '0 0 0 0 hsl(var(--primary)/0)' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s ease-in-out infinite',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
        'gradient-card': 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}
