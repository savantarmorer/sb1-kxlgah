import { colors } from './tokens/colors';
import { typography } from './tokens/typography';
import { spacing } from './tokens/spacing';
import { breakpoints } from './tokens/breakpoints';
import { gradients } from './utils/gradients';
import { animations, keyframes } from './utils/animations';
import { styles } from './utils/styles';
import { createTheme, Theme, ThemeOptions } from '@mui/material/styles';
import { buttonStyles } from './components/button';
import { cardStyles } from './components/card';
import type { AppTheme } from './types/theme.d';

// Theme configuration
const themeConfig = {
  colors,
  typography,
  spacing,
  breakpoints,
  gradients,
  animations,
  keyframes,
  styles,
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glow: (color: string) => `0 0 20px ${color}`,
  },
} as const;

// Create MUI theme with our tokens
export const createAppTheme = (mode: 'light' | 'dark') => {
  // Create base theme with MUI's spacing function
  const baseTheme = createTheme({
    spacing: (factor: number) => `${spacing.unit * factor}rem`,
  });

  // Create full theme with all configurations
  const theme = createTheme({
    ...baseTheme,
    palette: {
      mode,
      primary: {
        main: colors.brand.primary[500],
        light: colors.brand.primary[300],
        dark: colors.brand.primary[700],
      },
      secondary: {
        main: colors.brand.secondary[500],
        light: colors.brand.secondary[300],
        dark: colors.brand.secondary[700],
      },
      background: mode === 'dark' ? colors.dark.background : colors.light.background,
      text: mode === 'dark' ? colors.dark.text : colors.light.text,
    },
    typography: {
      fontFamily: typography.fontFamily.primary,
      ...typography.variant,
    },
    breakpoints: {
      values: breakpoints,
    },
    components: {
      MuiButton: buttonStyles,
      MuiCard: cardStyles,
    },
  });

  // Merge MUI theme with our custom properties
  const customTheme = {
    ...theme,
    colors,
    gradients,
    animations,
    styles,
    shadow: themeConfig.shadow,
    spacing: {
      ...spacing,
      // Preserve MUI's spacing function
      __proto__: theme.spacing,
    },
  };

  return customTheme as AppTheme;
};

// Export theme configuration and types
export type ThemeConfig = typeof themeConfig;

// Export all theme utilities and types
export * from './types/theme.d';
export { styles } from './utils/styles';
export { gradients } from './utils/gradients';
export { animations, keyframes } from './utils/animations';

export default themeConfig; 