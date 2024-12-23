import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, useTheme, alpha } from '@mui/material';
import { Swords, Trophy, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../../contexts/GameContext';
import { BATTLE_CONFIG } from '../../config/battleConfig';

interface PreBattleLobbyProps {
  onBattleStart: () => void;
  onCancel: () => void;
  onModeSelect: (mode: string) => void;
  selectedMode: string;
}

export function PreBattleLobby({ 
  onBattleStart, 
  onCancel,
  onModeSelect,
  selectedMode 
}: PreBattleLobbyProps) {
  const theme = useTheme();
  const { state } = useGame();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartBattle = async () => {
    setIsLoading(true);
    try {
      await onBattleStart();
    } catch (error) {
      console.error('Error starting battle:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      p: 4
    }}>
      {/* Battle Stats */}
      <Box sx={{ 
        display: 'flex',
        gap: 4,
        alignItems: 'center'
      }}>
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
          <Trophy size={20} className="text-yellow-500" />
          <Typography variant="body1" color="text.secondary">
            Wins: <span className="font-bold">{state.battleStats?.wins || 0}</span>
          </Typography>
        </Box>
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 1,
          px: 2,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.2)
        }}>
          <Star size={20} className="text-primary" />
          <Typography variant="body1" color="text.secondary">
            Rating: <span className="font-bold">{state.battleRatings?.rating || BATTLE_CONFIG.matchmaking.default_rating}</span>
          </Typography>
        </Box>
      </Box>

      {/* Mode Selection */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}>
        <Typography variant="h6" color="text.secondary">
          Select Battle Mode
        </Typography>
        <Box sx={{ 
          display: 'flex',
          gap: 2
        }}>
          {['all', 'constitutional', 'criminal', 'civil'].map((mode) => (
            <Button
              key={mode}
              variant={selectedMode === mode ? 'contained' : 'outlined'}
              onClick={() => onModeSelect(mode)}
              sx={{
                minWidth: 120,
                textTransform: 'capitalize'
              }}
            >
              {mode}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Start Button */}
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleStartBattle}
          disabled={isLoading}
          startIcon={<Swords />}
          sx={{ 
            minWidth: 200,
            py: 1.5
          }}
        >
          {isLoading ? 'Preparing Battle...' : 'Start Battle'}
        </Button>
      </motion.div>

      {/* Cancel Button */}
      <Button
        variant="text"
        color="inherit"
        onClick={onCancel}
        disabled={isLoading}
      >
        Cancel
      </Button>
    </Box>
  );
} 