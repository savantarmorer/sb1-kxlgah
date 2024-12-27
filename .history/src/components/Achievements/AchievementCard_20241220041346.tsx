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
import { alpha } from '@mui/material/styles';
import { EmojiEvents as TrophyIcon, CardGiftcard as GiftIcon } from '@mui/icons-material';
import { AchievementService } from '../../services/achievementService';
import { Achievement, AchievementReward, AchievementMilestone } from '../../types/achievements';
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

const RewardPreview = ({ reward }: { reward: AchievementReward }) => {
  const theme = useTheme();
  
  const getRewardIcon = () => {
    switch (reward.type) {
      case 'coins':
        return '🪙';
      case 'gems':
        return '💎';
      case 'xp':
        return '⭐';
      case 'title':
        return '📜';
      case 'avatar':
        return '🎭';
      default:
        return '🎁';
    }
  };

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 1,
        py: 0.5,
        borderRadius: 'full',
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1),
        color: theme.palette.primary.main,
        fontSize: 'sm',
      }}
    >
      {getRewardIcon()}
      <Typography variant="caption">
        {reward.value} {reward.type}
      </Typography>
    </Box>
  );
};

const MilestonePreview = ({ milestone, currentProgress }: { 
  milestone: AchievementMilestone; 
  currentProgress: number;
}) => {
  const theme = useTheme();
  const isReached = currentProgress >= milestone.progress;
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: alpha(
          isReached ? theme.palette.success.main : theme.palette.action.hover,
          theme.palette.mode === 'dark' ? 0.2 : 0.1
        ),
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: isReached ? theme.palette.success.main : theme.palette.action.selected,
          color: isReached ? theme.palette.success.contrastText : theme.palette.text.secondary,
        }}
      >
        {isReached ? '✓' : `${milestone.progress}%`}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight="medium">
          {milestone.description || `Reach ${milestone.progress}% completion`}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <RewardPreview reward={milestone.reward} />
        </Box>
      </Box>
    </Box>
  );
};

export const AchievementCard = ({ achievement, userId, onUpdate }: AchievementCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  const handleClaim = async () => {
    if (!achievement.ready_to_claim || isLoading) return;
    
    try {
      setIsLoading(true);
      const success = await AchievementService.claimAchievement(userId, achievement.id);
      
      if (success) {
        enqueueSnackbar('Achievement claimed successfully!', { variant: 'success' });
        onUpdate?.();
      } else {
        enqueueSnackbar('Failed to claim achievement. Please try again.', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error claiming achievement:', error);
      enqueueSnackbar('Failed to claim achievement. Please try again.', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Get next milestone
  const nextMilestone = achievement.milestones
    ?.filter(m => m.progress > achievement.progress)
    .sort((a, b) => a.progress - b.progress)[0];

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
              {achievement.rewards && achievement.rewards.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {achievement.rewards.map((reward, index) => (
                    <RewardPreview key={index} reward={reward} />
                  ))}
                </Box>
              )}
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

          {/* Milestone Preview */}
          {nextMilestone && !achievement.unlocked && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Next Milestone
              </Typography>
              <MilestonePreview 
                milestone={nextMilestone}
                currentProgress={achievement.progress}
              />
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  );
};