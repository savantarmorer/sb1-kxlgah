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
import { Achievement } from '../../types/achievements';
import { useSnackbar } from 'notistack';
import { RewardDisplay } from './RewardDisplay';
import { getRarityStyles, getRarityColorScheme } from './styles';

interface AchievementCardProps {
  achievement: Achievement;
  userId: string;
  onUpdate?: () => void;
}

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