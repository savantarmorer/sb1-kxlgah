import { createTheme, alpha, Theme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    primary: {
      main: '#8257e6',
      light: '#9466ff',
      dark: '#633BBC',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2998ff',
      light: '#64B5F6',
      dark: '#1E88E5',
      contrastText: '#ffffff',
    },
    error: {
      main: '#FF5252',
      light: '#FF867F',
      dark: '#D32F2F',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#FFA726',
      light: '#FFB74D',
      dark: '#F57C00',
      contrastText: '#ffffff',
    },
    info: {
      main: '#64B5F6',
      light: '#90CAF9',
      dark: '#42A5F5',
      contrastText: '#ffffff',
    },
    success: {
      main: '#66BB6A',
      light: '#81C784',
      dark: '#388E3C',
      contrastText: '#ffffff',
    },
    grey: {
      50: mode === 'dark' ? '#fafafa' : '#fafafa',
      100: mode === 'dark' ? '#f5f5f5' : '#f5f5f5',
      200: mode === 'dark' ? '#eeeeee' : '#eeeeee',
      300: mode === 'dark' ? '#e0e0e0' : '#e0e0e0',
      400: mode === 'dark' ? '#bdbdbd' : '#bdbdbd',
      500: mode === 'dark' ? '#9e9e9e' : '#9e9e9e',
      600: mode === 'dark' ? '#757575' : '#757575',
      700: mode === 'dark' ? '#616161' : '#616161',
      800: mode === 'dark' ? '#424242' : '#424242',
      900: mode === 'dark' ? '#212121' : '#212121',
      A100: mode === 'dark' ? '#f5f5f5' : '#f5f5f5',
      A200: mode === 'dark' ? '#eeeeee' : '#eeeeee',
      A400: mode === 'dark' ? '#bdbdbd' : '#bdbdbd',
      A700: mode === 'dark' ? '#616161' : '#616161',
    },
    ...(mode === 'dark' ? {
      background: {
        default: '#121214',
        paper: '#1a1b1e',
      },
      text: {
        primary: '#ffffff',
        secondary: alpha('#ffffff', 0.7),
        disabled: alpha('#ffffff', 0.5),
      },
      divider: alpha('#ffffff', 0.12),
      action: {
        active: '#ffffff',
        hover: alpha('#ffffff', 0.08),
        selected: alpha('#ffffff', 0.16),
        disabled: alpha('#ffffff', 0.3),
        disabledBackground: alpha('#ffffff', 0.12),
      },
    } : {
      background: {
        default: '#f8f9fa',
        paper: '#ffffff',
      },
      text: {
        primary: '#1a1b1e',
        secondary: alpha('#1a1b1e', 0.7),
        disabled: alpha('#1a1b1e', 0.5),
      },
      divider: alpha('#1a1b1e', 0.12),
      action: {
        active: '#1a1b1e',
        hover: alpha('#1a1b1e', 0.04),
        selected: alpha('#1a1b1e', 0.08),
        disabled: alpha('#1a1b1e', 0.26),
        disabledBackground: alpha('#1a1b1e', 0.12),
      },
    }),
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.2,
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.75rem',
      lineHeight: 1.2,
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.5rem',
      lineHeight: 1.2,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.2,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.2,
    },
    subtitle1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      fontWeight: 500,
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
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: mode === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.25)'
            : '0 4px 20px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: mode === 'dark'
            ? '0 8px 32px rgba(0,0,0,0.4)'
            : '0 8px 32px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          overflow: 'hidden',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          backgroundColor: mode === 'dark'
            ? alpha('#ffffff', 0.9)
            : alpha('#1a1b1e', 0.9),
          color: mode === 'dark' ? '#1a1b1e' : '#ffffff',
          fontSize: '0.75rem',
          fontWeight: 500,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

export const lightTheme = createTheme(getDesignTokens('light'));
export const darkTheme = createTheme(getDesignTokens('dark'));

export type AppTheme = Theme;

// Default export
export default lightTheme; 