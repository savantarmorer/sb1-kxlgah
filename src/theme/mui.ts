import { createTheme, alpha, Components, Theme } from '@mui/material/styles';
import { ThemeOptions } from '@mui/material/styles';
import { PaletteOptions } from '@mui/material/styles/createPalette';

// Brand colors (temporary until we properly export from theme.ts)
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
};

// Keyframes for gradient animations
const gradientKeyframes = {
  '@keyframes gradientBg1': {
    '0%, 100%': {
      backgroundPosition: '0% 50%',
    },
    '50%': {
      backgroundPosition: '100% 50%',
    },
  },
  '@keyframes gradientBg2': {
    '0%, 100%': {
      backgroundPosition: '100% 0%',
    },
    '50%': {
      backgroundPosition: '0% 100%',
    },
  },
};

// Common styles for both light and dark themes
const commonStyles: Partial<ThemeOptions> = {
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
  shape: {
    borderRadius: 12,
  },
};

// Component overrides
const componentOverrides: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: {
      ...gradientKeyframes,
      'html, body': {
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        width: '100%',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: 'none',
        fontWeight: 500,
        padding: '0.5rem 1rem',
      },
    },
    variants: [
      {
        props: { variant: 'contained' },
        style: {
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
        },
      },
    ],
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        backgroundImage: 'none',
        backdropFilter: 'blur(8px)',
      },
    },
    variants: [
      {
        props: { variant: 'outlined' },
        style: {
          '&:hover': {
            transform: 'translateY(-2px)',
            transition: 'transform 0.3s ease-in-out',
          },
        },
      },
    ],
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        backdropFilter: 'blur(8px)',
      },
    },
  },
};

// Light theme
export const lightTheme = createTheme({
  ...commonStyles,
  palette: {
    mode: 'light',
    primary: {
      main: brandColors.primary[600],
      light: brandColors.primary[400],
      dark: brandColors.primary[800],
      contrastText: '#ffffff',
    },
    secondary: {
      main: brandColors.secondary[600],
      light: brandColors.secondary[400],
      dark: brandColors.secondary[800],
      contrastText: '#ffffff',
    },
    background: {
      default: '#f9fafb',
      paper: alpha('#ffffff', 0.9),
    },
    text: {
      primary: '#111827',
      secondary: '#4b5563',
    },
  },
  components: {
    ...componentOverrides,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: `
            linear-gradient(45deg, 
              ${alpha(brandColors.primary[50], 0.2)} 0%, 
              ${alpha(brandColors.secondary[50], 0.2)} 50%,
              ${alpha(brandColors.primary[50], 0.2)} 100%)
          `,
          backgroundSize: '400% 400%',
          animation: 'gradientBg1 15s ease infinite',
        },
      },
    },
  },
});

// Dark theme
export const darkTheme = createTheme({
  ...commonStyles,
  palette: {
    mode: 'dark',
    primary: {
      main: brandColors.primary[400],
      light: brandColors.primary[300],
      dark: brandColors.primary[600],
      contrastText: '#ffffff',
    },
    secondary: {
      main: brandColors.secondary[400],
      light: brandColors.secondary[300],
      dark: brandColors.secondary[600],
      contrastText: '#ffffff',
    },
    background: {
      default: '#111827',
      paper: alpha('#1f2937', 0.9),
    },
    text: {
      primary: '#f9fafb',
      secondary: '#d1d5db',
    },
  },
  components: {
    ...componentOverrides,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: `
            linear-gradient(45deg, 
              ${alpha(brandColors.primary[900], 0.3)} 0%, 
              ${alpha(brandColors.secondary[900], 0.3)} 50%,
              ${alpha(brandColors.primary[900], 0.3)} 100%)
          `,
          backgroundSize: '400% 400%',
          animation: 'gradientBg2 20s ease infinite',
        },
      },
    },
  },
});

// For backward compatibility
export const muiTheme = lightTheme;

// Default export
export default lightTheme; 