import React from 'react';
import { Box, Typography, useTheme, alpha, Paper } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Sword, Shield, Repeat, Star } from 'lucide-react';
import type { Card } from '../../utils/cardUtils';
import { BattleStateEnum, BattleRewards } from '../../types/battle';

interface BattleResolutionProps {
  rewards: BattleRewards;
  currentHealth: {
  isCorrect: boolean;
  playerCard: Card;
  opponentCard: Card;
  damage: number;
  newPlayerHealth: number;
  newOpponentHealth: number;
  onComplete: () => void;
}

const actionIcons = {
  attack: Sword,
  defense: Shield,
  counter: Repeat,
  special: Star
};

const actionColors = {
  attack: '#ef4444',
  defense: '#3b82f6',
  counter: '#8b5cf6',
  special: '#f59e0b'
};

export function BattleResolution({
  isCorrect,
  playerCard,
  opponentCard,
  damage,
  newPlayerHealth,
  newOpponentHealth,
  onComplete
}: BattleResolutionProps) {
  const theme = useTheme();

  React.useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      sx={{
        position: 'fixed',
        inset: 0,
        bgcolor: alpha(theme.palette.background.paper, 0.95),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <Paper
        elevation={24}
        sx={{
          p: 4,
          borderRadius: 4,
          maxWidth: 600,
          width: '90%',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Question Result */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 4
          }}
        >
          {isCorrect ? (
            <CheckCircle size={32} color={theme.palette.success.main} />
          ) : (
            <XCircle size={32} color={theme.palette.error.main} />
          )}
          <Typography variant="h4" color={isCorrect ? 'success.main' : 'error.main'}>
            {isCorrect ? 'Correct!' : 'Incorrect!'}
          </Typography>
        </Box>

        {/* Battle Resolution */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Card Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
            {/* Player Card Action */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Your Action
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: alpha(actionColors[playerCard.action], 0.1),
                  border: '1px solid',
                  borderColor: actionColors[playerCard.action],
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {React.createElement(actionIcons[playerCard.action], {
                  size: 20,
                  color: actionColors[playerCard.action]
                })}
                <Typography
                  sx={{
                    color: actionColors[playerCard.action],
                    textTransform: 'capitalize'
                  }}
                >
                  {playerCard.action} ({playerCard.power})
                </Typography>
              </Paper>
            </Box>

            {/* Opponent Card Action */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Opponent's Action
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: alpha(actionColors[opponentCard.action], 0.1),
                  border: '1px solid',
                  borderColor: actionColors[opponentCard.action],
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {React.createElement(actionIcons[opponentCard.action], {
                  size: 20,
                  color: actionColors[opponentCard.action]
                })}
                <Typography
                  sx={{
                    color: actionColors[opponentCard.action],
                    textTransform: 'capitalize'
                  }}
                >
                  {opponentCard.action} ({opponentCard.power})
                </Typography>
              </Paper>
            </Box>
          </Box>

          {/* Damage Result */}
          <Box sx={{ textAlign: 'center', my: 2 }}>
            <Typography variant="h5" color="text.primary" gutterBottom>
              {isCorrect ? 'You dealt' : 'You received'}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                color: theme.palette.error.main,
                fontWeight: 'bold',
                textShadow: `0 0 10px ${alpha(theme.palette.error.main, 0.5)}`
              }}
            >
              {damage} Damage
            </Typography>
          </Box>

          {/* Health Changes */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 4, mt: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Your Health
              </Typography>
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    height: 8,
                    bgcolor: 'background.default',
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    component={motion.div}
                    initial={{ width: `${(isCorrect ? newPlayerHealth : newPlayerHealth + damage) / 50 * 100}%` }}
                    animate={{ width: `${newPlayerHealth / 50 * 100}%` }}
                    transition={{ duration: 0.5 }}
                    sx={{
                      height: '100%',
                      bgcolor: 'error.main',
                      borderRadius: 4
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ float: 'right' }}>
                  {newPlayerHealth}/50
                </Typography>
              </Box>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Opponent's Health
              </Typography>
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    height: 8,
                    bgcolor: 'background.default',
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    component={motion.div}
                    initial={{ width: `${(isCorrect ? newOpponentHealth + damage : newOpponentHealth) / 50 * 100}%` }}
                    animate={{ width: `${newOpponentHealth / 50 * 100}%` }}
                    transition={{ duration: 0.5 }}
                    sx={{
                      height: '100%',
                      bgcolor: 'error.main',
                      borderRadius: 4
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ float: 'right' }}>
                  {newOpponentHealth}/50
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
} 