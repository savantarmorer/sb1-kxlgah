import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { 
  CardGiftcard as GiftIcon,
  Diamond as GemIcon,
  MonetizationOn as CoinIcon,
  Stars as XPIcon,
  Face as AvatarIcon,
  Title as TitleIcon
} from '@mui/icons-material';
import { AchievementReward, MilestoneReward } from '../../types/achievements';

interface RewardDisplayProps {
  reward: AchievementReward | MilestoneReward;
  size?: 'small' | 'medium';
}

export const RewardDisplay = ({ reward, size = 'medium' }: RewardDisplayProps) => {
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