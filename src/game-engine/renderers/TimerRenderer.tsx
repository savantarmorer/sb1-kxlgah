import React from 'react';
import { Box, Typography, LinearProgress, useTheme } from '@mui/material';
import { TimerEntity } from '../types';

interface TimerRendererProps {
  entity: TimerEntity;
}

export const TimerRenderer: React.FC<TimerRendererProps> = ({ entity }) => {
  const theme = useTheme();
  const { turnTimeLeft, matchTimeLeft, isRunning } = entity;

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: 2,
        minWidth: 200
      }}
    >
      <Box>
        <Typography variant="subtitle2" color="primary">Turn Time</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinearProgress
            variant="determinate"
            value={(turnTimeLeft / 30) * 100}
            sx={{
              flexGrow: 1,
              height: 8,
              borderRadius: 4
            }}
          />
          <Typography variant="body2">
            {formatTime(turnTimeLeft)}
          </Typography>
        </Box>
      </Box>

      <Box>
        <Typography variant="subtitle2" color="primary">Match Time</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinearProgress
            variant="determinate"
            value={(matchTimeLeft / 300) * 100}
            color="secondary"
            sx={{
              flexGrow: 1,
              height: 8,
              borderRadius: 4
            }}
          />
          <Typography variant="body2">
            {formatTime(matchTimeLeft)}
          </Typography>
        </Box>
      </Box>

      {!isRunning && (
        <Typography
          variant="subtitle2"
          color="warning.main"
          sx={{ textAlign: 'center', mt: 1 }}
        >
          PAUSED
        </Typography>
      )}
    </Box>
  );
}; 