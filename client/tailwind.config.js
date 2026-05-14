/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        eco: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        dark: {
          50:  '#f9fafb',
          100: '#1a1f1a',
          200: '#141914',
          300: '#0f130f',
          400: '#0b0e0b',
          500: '#080d08',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'fade-in':   'fadeIn 0.5s ease forwards',
        'fade-up':   'fadeUp 0.6s ease forwards',
        'spin-slow': 'spin 8s linear infinite',
        'pulse-glow':'pulseGlow 2s ease infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        fadeUp:    { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'none' } },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(34,197,94,0.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(34,197,94,0)' },
        },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};
