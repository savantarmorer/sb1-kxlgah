import { Components, Theme } from '@mui/material/styles';
import { colors } from '../tokens/colors';
import { animations } from '../utils/animations';
import { gradients } from '../utils/gradients';

export const buttonStyles: Components<Theme>['MuiButton'] = {
  defaultProps: {
    disableElevation: true,
  },
  styleOverrides: {
    root: {
      textTransform: 'none',
      borderRadius: '8px',
      fontWeight: 500,
      padding: '0.5rem 1rem',
      transition: 'all 200ms ease',

      '&:hover': {
        transform: 'translateY(-1px)',
      },
    },
    contained: {
      background: gradients.brand.primary,
      color: colors.neutral.white,
      
      '&:hover': {
        background: gradients.brand.primary,
        filter: 'brightness(110%)',
        boxShadow: '0 4px 8px -2px rgba(79, 70, 229, 0.2)',
      },
    },
    outlined: {
      borderColor: colors.brand.primary[200],
      color: colors.brand.primary[600],
      
      '&:hover': {
        borderColor: colors.brand.primary[300],
        backgroundColor: colors.brand.primary[50],
      },
    },
    text: {
      color: colors.brand.primary[600],
      
      '&:hover': {
        backgroundColor: colors.brand.primary[50],
      },
    },
    // Size variants
    sizeLarge: {
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
    },
    sizeSmall: {
      padding: '0.25rem 0.75rem',
      fontSize: '0.875rem',
    },
  },
  variants: [
    {
      props: { variant: 'gradient' },
      style: {
        background: gradients.brand.primary,
        color: colors.neutral.white,
        border: 'none',
        
        '&:hover': {
          filter: 'brightness(110%)',
          boxShadow: '0 4px 8px -2px rgba(79, 70, 229, 0.2)',
        },

        '&:disabled': {
          background: colors.neutral.gray[200],
          color: colors.neutral.gray[400],
        },
      },
    },
    {
      props: { variant: 'glass' },
      style: {
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: colors.neutral.white,
        
        '&:hover': {
          background: 'rgba(255, 255, 255, 0.2)',
        },
      },
    },
    {
      props: { loading: true },
      style: {
        position: 'relative',
        pointerEvents: 'none',
        
        '& .MuiButton-startIcon, & .MuiButton-endIcon': {
          animation: animations.spin.animation,
        },
      },
    },
  ],
}; 