import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Premium Grey/Silver Palette
        'mk-black':      '#0A0A0A',
        'mk-dark':       '#1F1F1F',
        'mk-dark-2':     '#2E2E2E',
        'mk-dark-3':     '#404040',
        'mk-mid':        '#6B6B6B',
        'mk-silver':     '#B8B8B8',
        'mk-silver-2':   '#C0C0C0',
        'mk-light':      '#E8E8E8',
        'mk-white':      '#F5F5F5',
        'mk-accent':     '#D4AF37', // Gold accent
        'mk-accent-2':   '#C0C0C0', // Silver accent

        // Semantic
        border:       'hsl(var(--border))',
        input:        'hsl(var(--input))',
        ring:         'hsl(var(--ring))',
        background:   'hsl(var(--background))',
        foreground:   'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg:   'var(--radius)',
        md:   'calc(var(--radius) - 2px)',
        sm:   'calc(var(--radius) - 4px)',
        xl:   '1rem',
        '2xl':'1.5rem',
        '3xl':'2rem',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-silver':   'linear-gradient(135deg, #B8B8B8 0%, #F5F5F5 50%, #B8B8B8 100%)',
        'gradient-dark':     'linear-gradient(135deg, #1F1F1F 0%, #2E2E2E 50%, #1F1F1F 100%)',
        'gradient-radial':   'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':    'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-mesh':     'radial-gradient(ellipse at top left, rgba(192,192,192,0.15) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(212,175,55,0.08) 0%, transparent 60%)',
      },
      boxShadow: {
        'glass':        '0 8px 32px 0 rgba(0,0,0,0.37)',
        'glass-sm':     '0 4px 16px 0 rgba(0,0,0,0.25)',
        'silver':       '0 0 20px rgba(192,192,192,0.3), 0 8px 32px rgba(0,0,0,0.4)',
        'silver-sm':    '0 0 10px rgba(192,192,192,0.2)',
        'glow':         '0 0 30px rgba(192,192,192,0.4)',
        'glow-gold':    '0 0 20px rgba(212,175,55,0.4)',
        'card-3d':      '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(192,192,192,0.1)',
        'elevation-1':  '0 2px 8px rgba(0,0,0,0.3)',
        'elevation-2':  '0 8px 24px rgba(0,0,0,0.4)',
        'elevation-3':  '0 16px 48px rgba(0,0,0,0.5)',
      },
      animation: {
        'float':          'float 3s ease-in-out infinite',
        'float-slow':     'float 5s ease-in-out infinite',
        'pulse-silver':   'pulse-silver 2s ease-in-out infinite',
        'shimmer':        'shimmer 2.5s linear infinite',
        'spin-slow':      'spin 8s linear infinite',
        'gradient-shift': 'gradient-shift 6s ease infinite',
        'slide-up':       'slide-up 0.5s ease-out',
        'slide-down':     'slide-down 0.5s ease-out',
        'fade-in':        'fade-in 0.4s ease-out',
        'scale-in':       'scale-in 0.3s ease-out',
        'glow-pulse':     'glow-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        'pulse-silver': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px rgba(192,192,192,0.3)' },
          '50%':      { opacity: '0.8', boxShadow: '0 0 25px rgba(192,192,192,0.6)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        'slide-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to:   { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(-20px)', opacity: '0' },
          to:   { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to:   { transform: 'scale(1)', opacity: '1' },
        },
        'glow-pulse': {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(192,192,192,0.3))' },
          '50%':      { filter: 'drop-shadow(0 0 20px rgba(192,192,192,0.7))' },
        },
      },
    },
  },
  plugins: [],
}

export default config
