import React from 'react';
import { Box, Typography, Button, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import { Trophy, Star, Zap, RotateCw, X } from 'lucide-react';

interface BattleResultsProps {
  score: {
    player: number;
    opponent: number;
  };
  streak: number;
  onPlayAgain: () => void;
  onExit: () => void;
}

export function BattleResults({ score, streak, onPlayAgain, onExit }: BattleResultsProps) {
  const theme = useTheme();
  const isWinner = score.player > score.opponent;
  const isDraw = score.player === score.opponent;

  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20
        }}
      >
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            bgcolor: isWinner 
              ? alpha(theme.palette.success.main, 0.1)
              : isDraw
              ? alpha(theme.palette.warning.main, 0.1)
              : alpha(theme.palette.error.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            mb: 3
          }}
        >
          <Trophy
            size={60}
            className={
              isWinner 
                ? 'text-success' 
                : isDraw
                ? 'text-warning'
                : 'text-error'
            }
          />
        </Box>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
          {isWinner ? 'Victory!' : isDraw ? 'Draw!' : 'Defeat!'}
        </Typography>

        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          my: 4
        }}>
          {/* Final Score */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" color="primary.main" sx={{ fontWeight: 800 }}>
              {score.player}
            </Typography>
            <Typography color="text.secondary">Your Score</Typography>
          </Box>

          <Typography variant="h3" color="text.secondary" sx={{ fontWeight: 300 }}>
            vs
          </Typography>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" color="error.main" sx={{ fontWeight: 800 }}>
              {score.opponent}
            </Typography>
            <Typography color="text.secondary">Opponent Score</Typography>
          </Box>
        </Box>

        {/* Stats */}
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          mb: 6
        }}>
          {streak > 0 && (
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 1,
              px: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.warning.main, 0.1)
            }}>
              <Zap size={20} className="text-yellow-500" />
              <Typography sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                {streak}x Streak
              </Typography>
            </Box>
          )}

          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 1,
            px: 2,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.1)
          }}>
            <Star size={20} className="text-primary" />
            <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              +{Math.floor(score.player * 10)} XP
            </Typography>
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<RotateCw />}
            onClick={onPlayAgain}
            sx={{ px: 4 }}
          >
            Play Again
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="large"
            startIcon={<X />}
            onClick={onExit}
            sx={{ px: 4 }}
          >
            Exit
          </Button>
        </Box>
      </motion.div>
    </Box>
  );
}
