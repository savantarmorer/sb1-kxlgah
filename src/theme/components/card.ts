import { Components, Theme } from '@mui/material/styles';
import { colors } from '../tokens/colors';
import { gradients } from '../utils/gradients';

export const cardStyles: Components<Theme>['MuiCard'] = {
  defaultProps: {
    elevation: 0,
  },
  styleOverrides: {
    root: {
      borderRadius: '16px',
      backgroundImage: 'none',
      position: 'relative',
      transition: 'all 200ms ease-in-out',
      overflow: 'hidden',
    },
  },
  variants: [
    {
      props: { variant: 'outlined' },
      style: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        background: 'transparent',
        
        '&:hover': {
          borderColor: 'rgba(255, 255, 255, 0.2)',
          transform: 'translateY(-2px)',
        },
      },
    },
    {
      props: { variant: 'glass' },
      style: {
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        
        '&:hover': {
          background: 'rgba(255, 255, 255, 0.15)',
        },
      },
    },
    {
      props: { variant: 'gradient' },
      style: {
        background: gradients.brand.primary,
        color: colors.neutral.white,
        border: 'none',
        
        '&:hover': {
          filter: 'brightness(110%)',
        },
      },
    },
    {
      props: { interactive: true },
      style: {
        cursor: 'pointer',
        
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    {
      props: { hoverable: true },
      style: {
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      },
    },
  ],
}; 