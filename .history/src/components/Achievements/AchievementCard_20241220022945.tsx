import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import { EmojiEvents as TrophyIcon, Gift as GiftIcon } from '@mui/icons-material';
import { AchievementService } from '../../services/achievementService';
import { Achievement } from '../../types/achievements';
import { useSnackbar } from 'notistack';

interface AchievementCardProps {
  achievement: Achievement;
  userId: string;
  onUpdate?: () => void;
}

const getRarityStyles = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'common':
      return {
        borderColor: '#B0BEC5',
        background: 'linear-gradient(135deg, #ECEFF1 0%, #CFD8DC 100%)',
      };
    case 'rare':
      return {
        borderColor: '#2196F3',
        background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
      };
    case 'epic':
      return {
        borderColor: '#9C27B0',
        background: 'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)',
      };
    case 'legendary':
      return {
        borderColor: '#FFB300',
        background: 'linear-gradient(135deg, #FFF8E1 0%, #FFE082 100%)',
      };
    default:
      return {
        borderColor: '#B0BEC5',
        background: 'linear-gradient(135deg, #ECEFF1 0%, #CFD8DC 100%)',
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

  const rarityStyles = getRarityStyles(achievement.rarity);

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
      }}
    >
      <Stack direction="row" spacing={2}>
        <Box flexShrink={0}>
          <Tooltip title={achievement.rarity}>
            <IconButton size="large" color={getRarityColorScheme(achievement.rarity) as any}>
              <TrophyIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box flex={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack spacing={1}>
              <Typography variant="h6">{achievement.title}</Typography>
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
                >
                  Claim
                </Button>
              )}
            </Stack>
          </Stack>
          <LinearProgress
            sx={{ mt: 2, borderRadius: 1 }}
            variant="determinate"
            value={achievement.progress}
            color={getRarityColorScheme(achievement.rarity) as any}
          />
        </Box>
      </Stack>
    </Box>
  );
};