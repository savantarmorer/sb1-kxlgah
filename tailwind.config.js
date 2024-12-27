/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-teal': {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        'app': {
          // Base backgrounds
          background: '#0f172a', // slate-900
          'background-light': '#1e293b', // slate-800
          'background-lighter': '#334155', // slate-700
          
          // Card backgrounds
          card: '#1e293b', // slate-800
          'card-hover': '#334155', // slate-700
          'card-active': '#475569', // slate-600
          
          // Primary action colors
          primary: {
            DEFAULT: '#14b8a6', // brand-teal-500
            hover: '#0d9488', // brand-teal-600
            light: '#2dd4bf', // brand-teal-400
            dark: '#0f766e', // brand-teal-700
          },
          
          // Secondary colors for accents
          secondary: {
            DEFAULT: '#8b5cf6', // violet-500
            hover: '#7c3aed', // violet-600
            light: '#a78bfa', // violet-400
            dark: '#6d28d9', // violet-700
          },
          
          // Success colors
          success: {
            DEFAULT: '#10b981', // emerald-500
            light: '#34d399', // emerald-400
            dark: '#059669', // emerald-600
          },
          
          // Warning colors
          warning: {
            DEFAULT: '#f59e0b', // amber-500
            light: '#fbbf24', // amber-400
            dark: '#d97706', // amber-600
          },
          
          // Error colors
          error: {
            DEFAULT: '#ef4444', // red-500
            light: '#f87171', // red-400
            dark: '#dc2626', // red-600
          },
          
          // Text colors
          text: {
            primary: '#f8fafc', // slate-50
            secondary: '#cbd5e1', // slate-300
            muted: '#94a3b8', // slate-400
            dark: '#475569', // slate-600
          },
          
          // Border colors
          border: {
            DEFAULT: '#475569', // slate-600
            light: '#64748b', // slate-500
            dark: '#334155', // slate-700
          },
          
          // Gradient colors
          gradient: {
            'primary-start': '#14b8a6', // brand-teal-500
            'primary-end': '#8b5cf6', // violet-500
            'secondary-start': '#8b5cf6', // violet-500
            'secondary-end': '#ec4899', // pink-500
            'dark-start': '#0f172a', // slate-900
            'dark-end': '#1e293b', // slate-800
          }
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, var(--tw-gradient-stops))',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-card': 'linear-gradient(to bottom right, var(--tw-gradient-stops))',
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
      },
      keyframes: {
        'gradient-y': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'center top'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'center center'
          }
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'gradient-xy': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        }
      },
      boxShadow: {
        'glow-primary': '0 0 20px -5px var(--tw-shadow-color)',
        'glow-secondary': '0 0 25px -5px var(--tw-shadow-color)',
      }
    },
  },
  plugins: [],
}