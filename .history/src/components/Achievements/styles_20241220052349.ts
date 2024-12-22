import { Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AchievementRarity } from '../../types/achievements';

export const getRarityStyles = (rarity: string, theme: Theme) => {
  switch (rarity) {
    case 'legendary':
      return {
        borderColor: alpha(theme.palette.warning.main, 0.5),
        '&:hover': {
          borderColor: theme.palette.warning.main,
        }
      };
    case 'epic':
      return {
        borderColor: alpha(theme.palette.secondary.main, 0.5),
        '&:hover': {
          borderColor: theme.palette.secondary.main,
        }
      };
    case 'rare':
      return {
        borderColor: alpha(theme.palette.info.main, 0.5),
        '&:hover': {
          borderColor: theme.palette.info.main,
        }
      };
    default:
      return {
        borderColor: alpha(theme.palette.text.secondary, 0.2),
        '&:hover': {
          borderColor: alpha(theme.palette.text.secondary, 0.4),
        }
      };
  }
};

export const getRarityColorScheme = (rarity: string) => {
  switch (rarity) {
    case 'legendary':
      return 'warning';
    case 'epic':
      return 'secondary';
    case 'rare':
      return 'info';
    default:
      return 'primary';
  }
}; 