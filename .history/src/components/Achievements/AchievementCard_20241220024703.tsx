import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Stack,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import { EmojiEvents as TrophyIcon, CardGiftcard as GiftIcon } from '@mui/icons-material';
import { AchievementService } from '../../services/achievementService';
import { Achievement } from '../../types/achievements';
import { useSnackbar } from 'notistack';

interface AchievementCardProps {
  achievement: Achievement;
  userId: string;
  onUpdate?: () => void;
}

const getRarityStyles = (rarity: string, theme: any) => {
  const isDark = theme.palette.mode === 'dark';
  const alpha = isDark ? 0.2 : 0.1;
  const borderAlpha = isDark ? 0.3 : 0.2;

  switch (rarity.toLowerCase()) {
    case 'common':
      return {
        borderColor: theme.palette.grey[isDark ? 700 : 300],
        background: `linear-gradient(135deg, ${theme.palette.grey[isDark ? 800 : 100]} 0%, ${theme.palette.grey[isDark ? 900 : 200]} 100%)`,
      };
    case 'rare':
      return {
        borderColor: theme.palette.info.main,
        background: `linear-gradient(135deg, ${theme.palette.info.dark}${Math.round(alpha * 255).toString(16)} 0%, ${theme.palette.info.main}${Math.round(borderAlpha * 255).toString(16)} 100%)`,
      };
    case 'epic':
      return {
        borderColor: theme.palette.secondary.main,
        background: `linear-gradient(135deg, ${theme.palette.secondary.dark}${Math.round(alpha * 255).toString(16)} 0%, ${theme.palette.secondary.main}${Math.round(borderAlpha * 255).toString(16)} 100%)`,
      };
    case 'legendary':
      return {
        borderColor: theme.palette.warning.main,
        background: `linear-gradient(135deg, ${theme.palette.warning.dark}${Math.round(alpha * 255).toString(16)} 0%, ${theme.palette.warning.main}${Math.round(borderAlpha * 255).toString(16)} 100%)`,
      };
    default:
      return {
        borderColor: theme.palette.grey[isDark ? 700 : 300],
        background: `linear-gradient(135deg, ${theme.palette.grey[isDark ? 800 : 100]} 0%, ${theme.palette.grey[isDark ? 900 : 200]} 100%)`,
      };
  }
};

const getRarityColorScheme = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'common':
      return 'primary';
    case 'rare':
      return 'info';
    case 'epic':
      return 'secondary';
    case 'legendary':
      return 'warning';
    default:
      return 'primary';
  }
};

export const AchievementCard = ({ achievement, userId, onUpdate }: AchievementCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  const handleClaim = async () => {
    setIsLoading(true);
    try {
      const success = await AchievementService.claimAchievement(userId, achievement.id);
      if (success) {
        onUpdate?.();
        enqueueSnackbar('Achievement rewards claimed!', { variant: 'success' });
      } else {
        enqueueSnackbar('Failed to claim achievement rewards', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error claiming achievement:', error);
      enqueueSnackbar('An unexpected error occurred', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderRewards = () => {
    const rewards = [];
    if (achievement.rewards) {
      rewards.push(...achievement.rewards.map((reward, index) => (
        <Typography key={`reward-${index}`} variant="body2" color="text.secondary">
          {reward.type === 'coins' && '🪙'}
          {reward.type === 'gems' && '💎'}
          {reward.type === 'xp' && '⭐'}
          {reward.type === 'title' && '📜'}
          {reward.type === 'avatar' && '🎭'}
          {' '}{reward.value} {reward.type}
        </Typography>
      )));
    }
    return rewards;
  };

  const rarityStyles = getRarityStyles(achievement.rarity, theme);

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        ...rarityStyles,
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
        bgcolor: theme.palette.background.paper,
      }}
    >
      <Stack direction="row" spacing={2}>
        <Box flexShrink={0}>
          <Tooltip title={achievement.rarity}>
            <IconButton 
              size="large" 
              color={getRarityColorScheme(achievement.rarity) as any}
              sx={{
                bgcolor: theme.palette.action.hover,
              }}
            >
              <TrophyIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box flex={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack spacing={1}>
              <Typography variant="h6" color="text.primary">
                {achievement.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {achievement.description}
              </Typography>
              {renderRewards()}
            </Stack>
            <Stack spacing={1} alignItems="flex-end">
              <Typography variant="body2" color="text.secondary">
                {achievement.progress}% Complete
              </Typography>
              {achievement.ready_to_claim && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleClaim}
                  disabled={isLoading}
                  startIcon={<GiftIcon />}
                  color={getRarityColorScheme(achievement.rarity) as any}
                  sx={{
                    boxShadow: theme.shadows[2],
                  }}
                >
                  Claim
                </Button>
              )}
            </Stack>
          </Stack>
          <LinearProgress
            sx={{ 
              mt: 2, 
              borderRadius: 1,
              bgcolor: theme.palette.action.hover,
            }}
            variant="determinate"
            value={achievement.progress}
            color={getRarityColorScheme(achievement.rarity) as any}
          />
        </Box>
      </Stack>
    </Box>
  );
};