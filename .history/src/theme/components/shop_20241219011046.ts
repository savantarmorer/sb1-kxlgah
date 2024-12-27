import { Theme } from '@mui/material/styles';

export const createShopStyles = (theme: Theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    padding: theme.spacing(3),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  filters: {
    display: 'flex',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
    marginBottom: theme.spacing(3),
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: theme.spacing(3),
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    transition: theme.transitions.create(['transform', 'box-shadow'], {
      duration: theme.transitions.duration.standard,
    }),
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[4],
    },
  },
  cardContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  cardActions: {
    padding: theme.spacing(2),
    justifyContent: 'space-between',
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.shape.borderRadius,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(1),
  },
  rarityBadge: {
    position: 'absolute',
    top: theme.spacing(2),
    right: theme.spacing(2),
  },
  priceTag: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    color: theme.palette.text.secondary,
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
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(0, 0, 0, 0.6)' 
      : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(4px)',
    borderRadius: theme.shape.borderRadius,
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(6),
    color: theme.palette.text.secondary,
  },
}); 