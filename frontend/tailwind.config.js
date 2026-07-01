/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)', opacity: 0 },
          '100%': { transform: 'translateX(0)',    opacity: 1 },
        },
        'fade-in': {
          '0%':   { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
      animation: {
        shimmer:        'shimmer 1.6s infinite linear',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'fade-in':      'fade-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
