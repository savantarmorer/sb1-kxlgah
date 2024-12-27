import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, useTheme, ToggleButtonGroup, ToggleButton, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useBattle } from '../../hooks/useBattle';
import { useMatchmaking } from '../../hooks/useMatchmaking';
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
  const { initializeBattle } = useBattle();
  const { joinQueue, leaveQueue, matchmakingState } = useMatchmaking();
  
  const [gameMode, setGameMode] = useState<'bot' | 'casual' | 'ranked'>('bot');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [searching, setSearching] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (searching) {
      const initBattle = async () => {
        try {
          // Initialize battle based on game mode
          await initializeBattle({
            is_bot: gameMode === 'bot',
            difficulty
          });

          // Join matchmaking queue if not playing against bot
          if (gameMode !== 'bot') {
            await joinQueue({
              mode: gameMode,
              difficulty
            });
          }

          onBattleStart();
        } catch (error) {
          console.error('Failed to initialize battle:', error);
          setSearching(false);
          setCountdown(3);
        }
      };

      timeoutId = setTimeout(initBattle, countdown * 1000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searching, countdown, initializeBattle, joinQueue, gameMode, difficulty, onBattleStart]);

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
    leaveQueue();
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
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Challenge an opponent to a card battle!
              </Typography>
            </Box>

            {/* Game Mode Selection */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Select Game Mode
              </Typography>
              <ToggleButtonGroup
                value={gameMode}
                exclusive
                onChange={(_, value) => value && setGameMode(value)}
                sx={{ mb: 2 }}
              >
                <ToggleButton value="bot">
                  Practice vs Bot
                </ToggleButton>
                <ToggleButton value="casual">
                  Casual Match
                </ToggleButton>
                <ToggleButton value="ranked">
                  Ranked Match
                </ToggleButton>
              </ToggleButtonGroup>

              {/* Difficulty Selection */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={difficulty}
                  label="Difficulty"
                  onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center'
              }}
            >
              <Button onClick={handleStartSearch} variant="primary">
                {gameMode === 'bot' ? 'Start Practice' : 'Find Opponent'}
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
              {gameMode === 'bot' ? 'Starting Practice Match...' : 'Searching for opponent...'}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {gameMode === 'bot' ? `Starting in ${countdown} seconds` : `Estimated wait time: ${countdown}s`}
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