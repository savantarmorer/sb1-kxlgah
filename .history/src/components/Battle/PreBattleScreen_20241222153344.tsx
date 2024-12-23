import React, { useEffect, useState } from 'react';
import { Box, Typography, Avatar, Paper, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '../../types/battle';
import { useGame } from '../../contexts/GameContext';
import { LiveMatchmakingService } from '../../services/liveMatchmakingService';

interface PreBattleScreenProps {
  opponent: Player;
  matchId: string;
  onBattleStart: () => void;
}

export function PreBattleScreen({ opponent, matchId, onBattleStart }: PreBattleScreenProps) {
  const { state } = useGame();
  const [countdown, setCountdown] = useState(5);
  const [bothPlayersReady, setBothPlayersReady] = useState(false);

  useEffect(() => {
    // Confirm this player is ready
    LiveMatchmakingService.confirmPlayerReady(matchId, state.user?.id || '');
  }, [matchId, state.user?.id]);

  useEffect(() => {
    if (bothPlayersReady) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onBattleStart();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [bothPlayersReady, onBattleStart]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: 3
      }}
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 2,
              bgcolor: 'background.paper',
              maxWidth: 600,
              width: '100%'
            }}
          >
            <Typography variant="h4" align="center" gutterBottom>
              Get Ready!
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-around', my: 4 }}>
              {/* Current Player */}
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  src={state.user?.avatar_url}
                  sx={{ width: 80, height: 80, mb: 2 }}
                />
                <Typography variant="h6">{state.user?.name}</Typography>
                <Typography color="text.secondary">
                  Level {state.user?.level || 1}
                </Typography>
                <Typography color="text.secondary">
                  Rating: {state.user?.battle_rating || 1000}
                </Typography>
              </Box>

              {/* VS Text */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 'bold',
                    color: 'primary.main'
                  }}
                >
                  VS
                </Typography>
              </Box>

              {/* Opponent */}
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  src={opponent.avatar_url}
                  sx={{ width: 80, height: 80, mb: 2 }}
                />
                <Typography variant="h6">{opponent.name}</Typography>
                <Typography color="text.secondary">
                  Level {opponent.level}
                </Typography>
                <Typography color="text.secondary">
                  Rating: {opponent.rating}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              {bothPlayersReady ? (
                <Typography variant="h2" color="primary">
                  {countdown}
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <CircularProgress size={24} />
                  <Typography>Waiting for opponent...</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
} 