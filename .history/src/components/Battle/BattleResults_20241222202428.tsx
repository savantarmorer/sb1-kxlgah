import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import { Trophy, Star, Zap, ArrowRight, RotateCcw } from 'lucide-react';
import Button from '../Button';

interface BattleResultsProps {
  score: {
    player: number;
    opponent: number;
  };
  streak: number;
  on_play_again: () => void;
  on_exit: () => void;
}

export function BattleResults({
  score,
  streak,
  on_play_again,
  on_exit
}: BattleResultsProps) {
  const theme = useTheme();
  const isVictory = score.player > score.opponent;
  const isDraw = score.player === score.opponent;

  const calculateRatingChange = () => {
    if (isDraw) return 0;
    const baseChange = 25;
    const streakBonus = Math.min(streak * 5, 25);
    const scoreDiff = Math.abs(score.player - score.opponent);
    const scoreDiffBonus = Math.min(scoreDiff * 5, 25);
    
    return isVictory 
      ? baseChange + streakBonus + scoreDiffBonus
      : -(baseChange - Math.floor(streakBonus / 2));
  };

  const ratingChange = calculateRatingChange();

  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      {/* Result Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 800,
            color: isVictory 
              ? 'success.main'
              : isDraw 
                ? 'text.primary'
                : 'error.main',
            mb: 2
          }}
        >
          {isVictory ? 'Victory!' : isDraw ? 'Draw!' : 'Defeat'}
        </Typography>
      </motion.div>

      {/* Score Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          mb: 4
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 'bold',
                color: 'primary.main'
              }}
            >
              {score.player}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              You
            </Typography>
          </Box>
          <Typography 
            variant="h4" 
            sx={{ 
              color: 'text.secondary',
              fontWeight: 'light'
            }}
          >
            vs
          </Typography>
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 'bold',
                color: 'error.main'
              }}
            >
              {score.opponent}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Opponent
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          mb: 6
        }}>
          {/* Streak */}
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 1,
            px: 2,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.warning.main, 0.1),
            border: '1px solid',
            borderColor: alpha(theme.palette.warning.main, 0.2)
          }}>
            <Zap size={20} className="text-yellow-500" />
            <Typography sx={{ fontWeight: 'bold', color: 'warning.main' }}>
              {streak}x Streak
            </Typography>
          </Box>

          {/* Rating Change */}
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 1,
            px: 2,
            borderRadius: 2,
            bgcolor: alpha(
              ratingChange >= 0 
                ? theme.palette.success.main 
                : theme.palette.error.main,
              0.1
            ),
            border: '1px solid',
            borderColor: alpha(
              ratingChange >= 0 
                ? theme.palette.success.main 
                : theme.palette.error.main,
              0.2
            )
          }}>
            <Star size={20} className={ratingChange >= 0 ? 'text-success' : 'text-error'} />
            <Typography 
              sx={{ 
                fontWeight: 'bold',
                color: ratingChange >= 0 ? 'success.main' : 'error.main'
              }}
            >
              {ratingChange >= 0 ? '+' : ''}{ratingChange} Rating
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'center',
          gap: 2
        }}>
          <Button
            variant="ghost"
            onClick={on_exit}
            startIcon={<ArrowRight />}
          >
            Exit
          </Button>
          <Button
            variant="primary"
            onClick={on_play_again}
            startIcon={<RotateCcw />}
          >
            Play Again
          </Button>
        </Box>
      </motion.div>
    </Box>
  );
}
