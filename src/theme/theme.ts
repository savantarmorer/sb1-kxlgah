import { createTheme, ThemeOptions } from '@mui/material/styles';
import { PaletteOptions } from '@mui/material/styles/createPalette';

// Custom brand colors
const brandColors = {
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
  accent: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  }
};

// Custom shadows
const shadows = [
  'none',
  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
];

// Light theme palette
const lightPalette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: brandColors.primary[600],
    light: brandColors.primary[400],
    dark: brandColors.primary[800],
    contrastText: '#ffffff',
    ...brandColors.primary
  },
  secondary: {
    main: brandColors.secondary[600],
    light: brandColors.secondary[400],
    dark: brandColors.secondary[800],
    contrastText: '#ffffff',
    ...brandColors.secondary
  },
  error: {
    main: '#dc2626',
    light: '#ef4444',
    dark: '#b91c1c',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#d97706',
    light: '#f59e0b',
    dark: '#b45309',
    contrastText: '#ffffff',
  },
  info: {
    main: '#2563eb',
    light: '#3b82f6',
    dark: '#1d4ed8',
    contrastText: '#ffffff',
  },
  success: {
    main: '#059669',
    light: '#10b981',
    dark: '#047857',
    contrastText: '#ffffff',
  },
  grey: {
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
  text: {
    primary: '#111827',
    secondary: '#4b5563',
    disabled: '#9ca3af',
  },
  background: {
    default: '#f9fafb',
    paper: '#ffffff',
  },
  divider: '#e5e7eb',
};

// Dark theme palette
const darkPalette: PaletteOptions = {
  mode: 'dark',
  primary: {
    main: brandColors.primary[400],
    light: brandColors.primary[300],
    dark: brandColors.primary[600],
    contrastText: '#ffffff',
    ...brandColors.primary
  },
  secondary: {
    main: brandColors.secondary[400],
    light: brandColors.secondary[300],
    dark: brandColors.secondary[600],
    contrastText: '#ffffff',
    ...brandColors.secondary
  },
  error: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
    contrastText: '#ffffff',
  },
  info: {
    main: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
    contrastText: '#ffffff',
  },
  success: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
    contrastText: '#ffffff',
  },
  grey: {
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
  text: {
    primary: '#f9fafb',
    secondary: '#d1d5db',
    disabled: '#6b7280',
  },
  background: {
    default: '#111827',
    paper: '#1f2937',
  },
  divider: '#374151',
};

// Theme configuration
const themeConfig: ThemeOptions = {
  palette: lightPalette,
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shadows: shadows as any,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '0.5rem 1rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid',
          borderColor: lightPalette.divider,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '1.5rem',
          '&:last-child': {
            paddingBottom: '1.5rem',
          },
        },
      },
    },
  },
};

// Create theme instances
export const lightTheme = createTheme({
  ...themeConfig,
  palette: lightPalette,
});

export const darkTheme = createTheme({
  ...themeConfig,
  palette: darkPalette,
});

export type AppTheme = typeof lightTheme;

// Default export
export default lightTheme; 