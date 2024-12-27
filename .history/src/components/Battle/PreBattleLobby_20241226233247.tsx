import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, useTheme, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useBattle } from '../../hooks/useBattle';
import { BattleStateEnum } from '../../types/battle';
import Button from '../Button';

interface PreBattleLobbyProps {
  onBattleStart: () => void;
  onCancel: () => void;
}

export const PreBattleLobby: React.FC<PreBattleLobbyProps> = ({
  onBattleStart,
  onCancel
}) => {
  const theme = useTheme();
  const { state, dispatch } = useBattle();
  const [searching, setSearching] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (searching) {
      timeoutId = setTimeout(() => {
        dispatch({
          type: 'INITIALIZE_BATTLE',
          payload: {
            player_role: 'promotoria',
            opponent: {
              is_bot: true,
              difficulty: 1
            }
          }
        });
        
        dispatch({
          type: 'SET_BATTLE_STATUS',
          payload: BattleStateEnum.PREPARING
        });

        onBattleStart();
      }, countdown * 1000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searching, countdown, dispatch, onBattleStart]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (searching && countdown > 0) {
      intervalId = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [searching, countdown]);

  const handleStartSearch = () => {
    setSearching(true);
  };

  const handleCancel = () => {
    setSearching(false);
    setCountdown(3);
    onCancel();
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        p: 4
      }}
    >
      <AnimatePresence mode="wait">
        {!searching ? (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Box
              sx={{
                textAlign: 'center',
                mb: 4
              }}
            >
              <Typography variant="h4" color="primary" gutterBottom>
                Battle Mode
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Challenge an opponent to a card battle!
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center'
              }}
            >
              <Button onClick={handleStartSearch} variant="primary">
                Find Opponent
              </Button>
              <Button onClick={handleCancel} variant="outline">
                Cancel
              </Button>
            </Box>
          </motion.div>
        ) : (
          <motion.div
            key="searching"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ textAlign: 'center' }}
          >
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              Searching for opponent...
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Starting in {countdown} seconds
            </Typography>
            <Button onClick={handleCancel} variant="outline" sx={{ mt: 2 }}>
              Cancel
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}; 