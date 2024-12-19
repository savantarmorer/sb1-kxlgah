import { Theme } from '@mui/material/styles';
import type { AppTheme } from '../types/theme';

export const createShopStyles = (theme: AppTheme) => ({
  container: {
    background: theme.gradients.dark.subtle,
    minHeight: '100vh',
    padding: theme.spacing(3),
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '200px',
      background: theme.gradients.brand.primary,
      opacity: 0.1,
      zIndex: 0,
    }
  },

  header: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(4),
    padding: theme.spacing(2),
    ...theme.styles.effects.glassmorphism,
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: theme.shadow.lg,
    border: theme.styles.border.light,
  },

  userStats: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(3),
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius * 2,
    ...theme.styles.effects.glassmorphismDark,
    boxShadow: theme.shadow.md,
  },

  statBox: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 2),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadow.glow(theme.colors.brand.primary[500]),
    }
  },

  categoryScroll: {
    display: 'flex',
    gap: theme.spacing(2),
    overflowX: 'auto',
    padding: theme.spacing(2, 0),
    marginBottom: theme.spacing(4),
    '&::-webkit-scrollbar': {
      height: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '4px',
    },
  },

  categoryButton: {
    minWidth: '120px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5, 3),
    borderRadius: theme.shape.borderRadius * 2,
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
    },
  },

  categoryButtonSelected: {
    background: theme.gradients.brand.primary,
    color: theme.colors.neutral.white,
    boxShadow: theme.shadow.glow(theme.colors.brand.primary[500]),
  },

  categoryButtonUnselected: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: theme.colors.neutral.white,
    border: theme.styles.border.light,
  },

  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(3),
    '& .icon': {
      color: theme.colors.brand.primary[400],
      filter: `drop-shadow(${theme.shadow.sm})`,
    },
    '& .text': {
      background: theme.gradients.brand.primary,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: 700,
      textShadow: theme.shadow.sm,
    }
  },

  itemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: theme.spacing(3),
    padding: theme.spacing(2),
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 10,
  },
});

export type ShopStyles = ReturnType<typeof createShopStyles>; 