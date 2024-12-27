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
  Avatar,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { 
  EmojiEvents as TrophyIcon, 
  CardGiftcard as GiftIcon,
  Diamond as GemIcon,
  MonetizationOn as CoinIcon,
  Stars as XPIcon,
  Face as AvatarIcon,
  Title as TitleIcon
} from '@mui/icons-material';
import { AchievementService } from '../../services/achievementService';
import { Achievement, AchievementReward, AchievementMilestone, MilestoneReward } from '../../types/achievements';
import { useSnackbar } from 'notistack';

interface RewardDisplayProps {
  reward: AchievementReward | MilestoneReward;
  size?: 'small' | 'medium';
}

const RewardDisplay = ({ reward, size = 'medium' }: RewardDisplayProps) => {
  const theme = useTheme();
  const iconSize = size === 'small' ? 16 : 20;
  const fontSize = size === 'small' ? 12 : 14;

  const getRewardIcon = () => {
    switch (reward.type) {
      case 'gems':
        return <GemIcon sx={{ color: theme.palette.info.main, fontSize: iconSize }} />;
      case 'coins':
        return <CoinIcon sx={{ color: theme.palette.warning.main, fontSize: iconSize }} />;
      case 'xp':
        return <XPIcon sx={{ color: theme.palette.success.main, fontSize: iconSize }} />;
      case 'avatar':
        return (
          <Avatar
            src={String(reward.value)}
            sx={{ width: iconSize, height: iconSize }}
          >
            <AvatarIcon fontSize="small" />
          </Avatar>
        );
      case 'title':
        return <TitleIcon sx={{ color: theme.palette.secondary.main, fontSize: iconSize }} />;
      default:
        return <GiftIcon sx={{ fontSize: iconSize }} />;
    }
  };

  const getRewardText = () => {
    switch (reward.type) {
      case 'avatar':
        return 'New Avatar';
      case 'title':
        return String(reward.value);
      default:
        return `+${reward.value}`;
    }
  };

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.5,
        borderRadius: 1,
        bgcolor: alpha(theme.palette.primary.main, 0.1),
      }}
    >
      {getRewardIcon()}
      <Typography variant="body2" sx={{ fontSize }}>
        {getRewardText()}
      </Typography>
    </Box>
  );
};

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
    if (!achievement.ready_to_claim || isLoading || !userId) return;
    
    try {
      setIsLoading(true);
      const success = await AchievementService.claimAchievement(userId, achievement.id);
      
      if (success) {
        achievement.ready_to_claim = false;
        achievement.claimed = true;
        
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

  const rarityStyles = getRarityStyles(achievement.rarity, theme);

  const nextMilestone = achievement.milestones
    ?.filter(m => (achievement.progress || 0) < m.progress)
    .sort((a, b) => a.progress - b.progress)[0];

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
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              {achievement.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {achievement.description}
            </Typography>
            
            {/* Display Rewards */}
            {achievement.rewards && achievement.rewards.length > 0 && (
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {achievement.rewards.map((reward, index) => (
                  <RewardDisplay key={index} reward={reward} />
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* Progress section */}
        <Box>
          <Typography variant="body2" color="text.secondary">
            {achievement.progress || 0}% Complete
          </Typography>
          <LinearProgress
            sx={{ 
              mt: 1, 
              borderRadius: 1,
              bgcolor: theme.palette.action.hover,
            }}
            variant="determinate"
            value={achievement.progress || 0}
            color={getRarityColorScheme(achievement.rarity) as any}
          />
        </Box>

        {/* Milestone Preview with Rewards */}
        {nextMilestone && !achievement.unlocked && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Next Milestone
            </Typography>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.action.hover, 0.5),
              }}
            >
              <Typography variant="body2" gutterBottom>
                {nextMilestone.description || `Reach ${nextMilestone.progress}% completion`}
              </Typography>
              {nextMilestone.reward && (
                <Box sx={{ mt: 1 }}>
                  <RewardDisplay reward={nextMilestone.reward} size="small" />
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Claim Button */}
        {achievement.ready_to_claim && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleClaim}
            disabled={isLoading}
            startIcon={<GiftIcon />}
            fullWidth
          >
            Claim Rewards
          </Button>
        )}
      </Stack>
    </Box>
  );
};