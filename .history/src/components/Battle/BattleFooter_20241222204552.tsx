import React from 'react';
import { Box, Typography } from '@mui/material';
import { Trophy, Star, Shield, Timer } from 'lucide-react';
import Button from '../Button';
import { BATTLE_CONFIG } from '../../config/battleConfig';

interface BattleFooterProps {
  battleStats: {
    wins: number;
    rating: number;
  };
  phase: string;
}

export function BattleFooter({ battleStats, phase }: BattleFooterProps) {
  return (
    <Box sx={{ 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      mt: 4,
      gap: 2
    }}>
      {/* Battle Stats */}
      <Box sx={{ 
        display: 'flex',
        gap: 2
      }}>
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 1,
          px: 2,
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: 1
        }}>
          <Trophy size={20} className="text-yellow-500" />
          <Typography variant="body2" color="text.secondary">
            Wins: <span className="font-bold">{battleStats.wins || 0}</span>
          </Typography>
        </Box>
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 1,
          px: 2,
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: 1
        }}>
          <Star size={20} className="text-purple-500" />
          <Typography variant="body2" color="text.secondary">
            Rating: <span className="font-bold">{battleStats.rating || BATTLE_CONFIG.matchmaking.default_rating}</span>
          </Typography>
        </Box>
      </Box>

      {/* Powerups */}
      <Box sx={{ 
        display: 'flex',
        gap: 2
      }}>
        <Button
          variant="ghost"
          startIcon={<Shield size={18} />}
          disabled={phase !== 'READY'}
        >
          50/50
        </Button>
        <Button
          variant="ghost"
          startIcon={<Timer size={18} />}
          disabled={phase !== 'READY'}
        >
          +15s
        </Button>
      </Box>
    </Box>
  );
} 