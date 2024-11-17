/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          teal: {
            50: '#f0f9fa',
            100: '#d0f1f5',
            200: '#a0e4eb',
            300: '#70d7e1',
            400: '#40cad7',
            500: '#20b2c1',
            600: '#108799',
            700: '#086577',
            800: '#044355',
            900: '#022133'
          },
          copper: {
            50: '#fdf6f0',
            100: '#fae8d8',
            200: '#f5d0b0',
            300: '#f0b888',
            400: '#eb9f60',
            500: '#e68738',
            600: '#cc6f20',
            700: '#a65718',
            800: '#803f10',
            900: '#5a2708'
          }
        }
      },
      animation: {
        'pulse-scale': 'pulse-scale 2s infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite'
      },
      keyframes: {
        'pulse-scale': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'glow': {
          '0%, 100%': { filter: 'brightness(1) blur(0px)' },
          '50%': { filter: 'brightness(1.2) blur(4px)' }
        }
      }
    },
  },
  plugins: [],
};