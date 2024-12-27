import { Box, Typography, LinearProgress } from '@mui/material';

interface BattleTimerProps {
  timeLeft: number;
  isActive: boolean;
}

export function BattleTimer({ timeLeft, isActive }: BattleTimerProps) {
  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Time Remaining
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {timeLeft}s
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={(timeLeft / 30) * 100} // Assuming 30 seconds is max time
        color={timeLeft > 10 ? 'primary' : timeLeft > 5 ? 'warning' : 'error'}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: 'background.paper',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            transition: 'transform 1s linear'
          }
        }}
      />
    </Box>
  );
} 