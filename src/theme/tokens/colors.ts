export const colors = {
  // Brand Colors
  brand: {
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    secondary: {
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
  },
  
  // Semantic Colors
  semantic: {
    success: {
      light: '#66BB6A',
      main: '#4CAF50',
      dark: '#388E3C',
    },
    error: {
      light: '#FF867F',
      main: '#FF5252',
      dark: '#D32F2F',
    },
    warning: {
      light: '#FFB74D',
      main: '#FFA726',
      dark: '#F57C00',
    },
    info: {
      light: '#90CAF9',
      main: '#64B5F6',
      dark: '#42A5F5',
    },
  },

  // Neutral Colors
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },

  // Theme-specific Colors
  light: {
    background: {
      default: '#f9fafb',
      paper: 'rgba(255, 255, 255, 0.9)',
    },
    text: {
      primary: '#111827',
      secondary: '#4b5563',
    },
  },
  dark: {
    background: {
      default: '#111827',
      paper: 'rgba(31, 41, 55, 0.9)',
    },
    text: {
      primary: '#f9fafb',
      secondary: '#d1d5db',
    },
  },
} as const;

export type ColorTokens = typeof colors; 