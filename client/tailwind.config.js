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
          50:  'rgba(var(--accent-green-light), <alpha-value>)',   // Light green tint (auto-darkens in dark mode)
          100: 'rgba(var(--text-heading-secondary), <alpha-value>)',   // Secondary Headings
          200: 'rgba(var(--text-body), <alpha-value>)',   // Body Text
          300: 'rgba(var(--text-muted), <alpha-value>)',   // Muted Text
          400: 'rgba(var(--accent-teal), <alpha-value>)',   // Accent Teal (bright in dark mode)
          500: 'rgba(var(--accent-green), <alpha-value>)',   // Primary Green (vivid in dark mode)
          600: 'rgba(var(--accent-green-hover), <alpha-value>)',   // Green Hover (vivid in dark mode)
          700: 'rgba(var(--text-heading-primary), <alpha-value>)',   // Secondary Navy / Primary Headings
          800: 'rgba(var(--text-muted), <alpha-value>)',   // Muted Text alternative
          900: 'rgba(var(--text-heading-primary), <alpha-value>)',   // Heading navy
          950: '#111827',
        },
        dark: {
          50:  'rgba(var(--bg-main), <alpha-value>)',   // Main Background
          100: 'rgba(var(--border-color), <alpha-value>)',   // Border Color
          200: 'rgba(var(--border-color), <alpha-value>)',   // Hover background
          300: 'rgba(var(--bg-card), <alpha-value>)',   // Card / Navbar Background
          400: 'rgba(var(--bg-input), <alpha-value>)',   // Surface Background
          500: 'rgba(var(--bg-main), <alpha-value>)',   // Main Background
        },
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
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
        slideUp:   { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        slideDown: { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(100%)' } },
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
