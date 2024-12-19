import { colors } from '../tokens/colors';
import { alpha } from '@mui/material';

export const gradients = {
  // Brand gradients
  brand: {
    primary: `linear-gradient(to right, ${colors.brand.primary[600]}, ${colors.brand.primary[800]})`,
    secondary: `linear-gradient(to right, ${colors.brand.secondary[600]}, ${colors.brand.secondary[800]})`,
  },

  // Theme-specific gradients
  light: {
    subtle: `linear-gradient(45deg, 
      ${alpha(colors.brand.primary[50], 0.2)} 0%, 
      ${alpha(colors.brand.secondary[50], 0.2)} 50%,
      ${alpha(colors.brand.primary[50], 0.2)} 100%
    )`,
    accent: `linear-gradient(45deg,
      ${alpha(colors.brand.primary[100], 0.3)} 0%,
      ${alpha(colors.brand.secondary[100], 0.3)} 100%
    )`,
  },

  dark: {
    subtle: `linear-gradient(45deg, 
      ${alpha(colors.brand.primary[900], 0.3)} 0%, 
      ${alpha(colors.brand.secondary[900], 0.3)} 50%,
      ${alpha(colors.brand.primary[900], 0.3)} 100%
    )`,
    accent: `linear-gradient(45deg,
      ${alpha(colors.brand.primary[800], 0.4)} 0%,
      ${alpha(colors.brand.secondary[800], 0.4)} 100%
    )`,
  },

  // Common gradients
  glass: {
    light: `linear-gradient(
      to bottom right,
      ${alpha('#ffffff', 0.9)},
      ${alpha('#ffffff', 0.7)}
    )`,
    dark: `linear-gradient(
      to bottom right,
      ${alpha('#1f2937', 0.9)},
      ${alpha('#1f2937', 0.7)}
    )`,
  },

  // Overlay gradients
  overlay: {
    top: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)',
    bottom: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)',
    right: 'linear-gradient(to left, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)',
    left: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)',
  },
} as const;

export type GradientTokens = typeof gradients; 