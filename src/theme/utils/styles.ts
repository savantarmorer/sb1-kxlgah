import { colors } from '../tokens/colors';
import { gradients } from './gradients';
import { alpha } from '@mui/material';

export const styles = {
  // Common layout patterns
  layout: {
    flexCenter: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    flexBetween: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    flexColumn: {
      display: 'flex',
      flexDirection: 'column',
    },
    gridCenter: {
      display: 'grid',
      placeItems: 'center',
    },
  },

  // Common visual effects
  effects: {
    glassmorphism: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    glassmorphismDark: {
      background: 'rgba(0, 0, 0, 0.2)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    hoverLift: {
      transition: 'transform 200ms ease',
      '&:hover': {
        transform: 'translateY(-2px)',
      },
    },
    hoverScale: {
      transition: 'transform 200ms ease',
      '&:hover': {
        transform: 'scale(1.05)',
      },
    },
    hoverGlow: (color: string) => ({
      transition: 'box-shadow 200ms ease',
      '&:hover': {
        boxShadow: `0 0 20px ${alpha(color, 0.5)}`,
      },
    }),
  },

  // Common text styles
  text: {
    truncate: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    gradient: {
      background: gradients.brand.primary,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
  },

  // Common border styles
  border: {
    light: `1px solid ${alpha(colors.neutral.white, 0.1)}`,
    dark: `1px solid ${alpha(colors.neutral.black, 0.1)}`,
    gradient: {
      border: '2px solid transparent',
      backgroundImage: `linear-gradient(${colors.neutral.white}, ${colors.neutral.white}), ${gradients.brand.primary}`,
      backgroundOrigin: 'border-box',
      backgroundClip: 'padding-box, border-box',
    },
  },

  // Common shadow styles
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glow: (color: string) => `0 0 20px ${alpha(color, 0.5)}`,
  },
} as const;

export type StyleTokens = typeof styles; 