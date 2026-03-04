/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        primary: { DEFAULT: '#10b981', dark: '#059669', light: '#34d399' },
        accent: '#6366f1',
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
        admin: {
          bg: '#0c0c1d',
          card: '#161631',
          border: '#252554',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        elevated: '0 4px 12px 0 rgb(0 0 0 / 0.08)',
        glow: '0 0 20px rgb(16 185 129 / 0.15)',
      },
    },
  },
  plugins: [],
}
