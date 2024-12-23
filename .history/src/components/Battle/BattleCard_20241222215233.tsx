import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';

interface BattleCardProps {
  isFlipped: boolean;
  isWinner: boolean;
  action: string;
}

export function BattleCard({ isFlipped, isWinner, action }: BattleCardProps) {
  const theme = useTheme();

  return (
    <Box
      component={motion.div}
      initial={{ rotateY: 0 }}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      sx={{
        width: 100,
        height: 140,
        perspective: 1000,
        position: 'relative',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: isWinner ? `0 0 20px ${alpha(theme.palette.success.main, 0.5)}` : 'none'
        }
      }}
    >
      {/* Card Front */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          boxShadow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'rotateY(180deg)',
          zIndex: isFlipped ? 1 : 0
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {action}
        </Typography>
      </Box>

      {/* Card Back */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          backgroundColor: theme.palette.grey[800],
          borderRadius: 2,
          boxShadow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.palette.common.white,
          zIndex: isFlipped ? 0 : 1
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          ?
        </Typography>
      </Box>
    </Box>
  );
} 