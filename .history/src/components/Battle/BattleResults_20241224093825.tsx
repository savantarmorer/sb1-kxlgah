import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import { Trophy, Star, Zap } from 'lucide-react';
import Button from '../ui/Button';
import type { BattleResultsProps } from '../../types/battle';

export function BattleResults({ score, streak, on_play_again, on_exit }: BattleResultsProps) {
  const theme = useTheme();
  const isVictory = score.player > score.opponent;

  return (
    <Box sx={{ 
      p: 4,
      textAlign: 'center'
    }}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <Typography variant="h3" sx={{ 
          mb: 2,
          color: isVictory ? theme.palette.success.main : theme.palette.error.main,
          textShadow: `0 0 20px ${alpha(
            isVictory ? theme.palette.success.main : theme.palette.error.main, 
            0.5
          )}`
        }}>
          {isVictory ? 'Victory!' : 'Defeat'}
        </Typography>
      </motion.div>

      <Box sx={{ 
        display: 'flex',
        justifyContent: 'center',
        gap: 4,
        mb: 4
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Trophy size={32} className="text-yellow-500 mb-2" />
          <Typography variant="h5">
            {score.player} - {score.opponent}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Final Score
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Star size={32} className="text-purple-500 mb-2" />
          <Typography variant="h5">
            {Math.ceil((score.player / (score.player + score.opponent)) * 100)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Performance
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Zap size={32} className="text-orange-500 mb-2" />
          <Typography variant="h5">
            {streak}x
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Best Streak
          </Typography>
        </Box>
      </Box>

      <Box sx={{ 
        display: 'flex',
        justifyContent: 'center',
        gap: 2
      }}>
        <Button
          variant="contained"
          onClick={on_play_again}
          sx={{ minWidth: 120 }}
        >
          Play Again
        </Button>
        <Button
          variant="outlined"
          onClick={on_exit}
          sx={{ minWidth: 120 }}
        >
          Exit
        </Button>
      </Box>
    </Box>
  );
}
