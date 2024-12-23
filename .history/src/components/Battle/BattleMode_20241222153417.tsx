import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Button, useTheme, alpha } from '@mui/material';
import { ArrowLeft, Timer, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../../contexts/GameContext';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { BattleService } from '../../services/battleService';
import { PreBattleScreen } from './PreBattleScreen';
import { BattleArena } from './BattleArena';
import { Player } from '../../types/battle';

export function BattleMode() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { state } = useGame();
  const { 
    matchmakingState, 
    joinQueue, 
    leaveQueue, 
    cancelMatch,
    isSearching,
    isMatched,
    opponent 
  } = useMatchmaking();

  const [showPreBattle, setShowPreBattle] = useState(false);
  const [battleStarted, setBattleStarted] = useState(false);
  const [currentOpponent, setCurrentOpponent] = useState<Player | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);

  useEffect(() => {
    if (isMatched && opponent && matchmakingState.matchId) {
      setCurrentOpponent(opponent);
      setMatchId(matchmakingState.matchId);
      setShowPreBattle(true);
    }
  }, [isMatched, opponent, matchmakingState.matchId]);

  const handlePlayWithBot = async () => {
    if (!state.user) return;
    
    try {
      const botOpponent = await BattleService.get_bot_opponent(state.user.level || 1);
      const botMatchId = `bot_${Date.now()}`;
      
      setCurrentOpponent(botOpponent);
      setMatchId(botMatchId);
      setShowPreBattle(true);
    } catch (error) {
      console.error('Error getting bot opponent:', error);
    }
  };

  const handleBattleStart = () => {
    setShowPreBattle(false);
    setBattleStarted(true);
  };

  const handleExitBattle = () => {
    setBattleStarted(false);
    setShowPreBattle(false);
    setCurrentOpponent(null);
    setMatchId(null);
  };

  if (showPreBattle && currentOpponent && matchId) {
    return (
      <PreBattleScreen
        opponent={currentOpponent}
        matchId={matchId}
        onBattleStart={handleBattleStart}
      />
    );
  }

  if (battleStarted && currentOpponent && matchId) {
    return (
      <BattleArena
        opponent={currentOpponent}
        matchId={matchId}
        onExit={handleExitBattle}
      />
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        mb: 4
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={() => navigate(-1)}
            sx={{ 
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': { bgcolor: 'background.paper' }
            }}
          >
            <ArrowLeft />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Battle Mode
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Test your knowledge in real-time battles
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ 
        maxWidth: 600, 
        mx: 'auto', 
        mt: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            fullWidth
            size="large"
            variant="contained"
            color="primary"
            onClick={() => joinQueue()}
            disabled={isSearching}
            sx={{ 
              py: 2,
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            {isSearching ? 'Searching for Opponent...' : 'Find Match'}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            fullWidth
            size="large"
            variant="outlined"
            startIcon={<Bot />}
            onClick={handlePlayWithBot}
            disabled={isSearching}
            sx={{ py: 2 }}
          >
            Practice with Bot
          </Button>
        </motion.div>

        {isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Button
              fullWidth
              color="error"
              variant="text"
              onClick={() => leaveQueue()}
              sx={{ mt: 2 }}
            >
              Cancel Search
            </Button>
          </motion.div>
        )}
      </Box>
    </Box>
  );
}