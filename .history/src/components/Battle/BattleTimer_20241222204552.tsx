import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { Timer } from 'lucide-react';

interface BattleTimerProps {
  timeLeft: number;
  isActive?: boolean;
}

export function BattleTimer({ timeLeft, isActive = true }: BattleTimerProps) {
  const theme = useTheme();

  return (
    <Box sx={{ 
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      py: 1,
      px: 2,
      borderRadius: 2,
      bgcolor: alpha(theme.palette.primary.main, 0.1),
      border: '1px solid',
      borderColor: alpha(theme.palette.primary.main, 0.2),
      opacity: isActive ? 1 : 0.5
    }}>
      <Timer size={20} className="text-primary" />
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        {timeLeft}s
      </Typography>
    </Box>
  );
} 