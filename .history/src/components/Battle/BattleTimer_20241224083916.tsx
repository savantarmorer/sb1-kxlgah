import React from 'react';
import { Box, Typography, LinearProgress, useTheme, alpha } from '@mui/material';
import { BATTLE_CONFIG } from '../../config/battleConfig';

interface BattleTimerProps {
  timeLeft: number;
  isActive: boolean;
  label?: string;
  maxTime?: number;
}

export const BattleTimer: React.FC<BattleTimerProps> = ({
  timeLeft,
  isActive,
  label,
  maxTime
}) => {
  const theme = useTheme();
  const defaultMaxTime = BATTLE_CONFIG.time_per_question;
  const actualMaxTime = maxTime || defaultMaxTime;
  const progress = (timeLeft / actualMaxTime) * 100;

  const getColor = () => {
    if (progress > 66) return theme.palette.success.main;
    if (progress > 33) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {label || (isActive ? 'Time Remaining' : 'Time's Up!')}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 'bold',
            color: getColor()
          }}
        >
          {timeLeft}s
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: alpha(theme.palette.grey[300], 0.5),
          '& .MuiLinearProgress-bar': {
            backgroundColor: getColor(),
            transition: 'transform 0.1s linear'
          }
        }}
      />
    </Box>
  );
}; 