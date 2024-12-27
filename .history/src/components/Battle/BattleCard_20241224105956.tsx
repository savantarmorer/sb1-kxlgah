import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import type { BattleAction } from '../../types/battle';

interface BattleCardProps {
  isFlipped: boolean;
  isWinner: boolean;
  action: BattleAction;
  power?: number;
  effect?: string;
}

export function BattleCard({ isFlipped, isWinner, action, power, effect }: BattleCardProps) {
  const theme = useTheme();

  const getActionColor = (action: BattleAction) => {
    switch (action) {
      case 'attack':
        return theme.palette.error.main;
      case 'defense':
        return theme.palette.info.main;
      case 'counter':
        return theme.palette.warning.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const getActionIcon = (action: BattleAction) => {
    switch (action) {
      case 'attack':
        return '⚔️';
      case 'defense':
        return '🛡️';
      case 'counter':
        return '↩️';
      default:
        return '❓';
    }
  };

  return (
    <Box
      component={motion.div}
      animate={{
        rotateY: isFlipped ? 180 : 0,
        scale: isWinner ? 1.1 : 1,
      }}
      transition={{ duration: 0.6 }}
      sx={{
        width: 120,
        height: 160,
        perspective: 1000,
        position: 'relative',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Front face */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          bgcolor: alpha(getActionColor(action), 0.1),
          borderRadius: 2,
          border: '2px solid',
          borderColor: alpha(getActionColor(action), 0.3),
          display: 'flex',
          flexDirection: 'column',
          p: 1,
          gap: 1
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 1
        }}>
          <Typography variant="h6" sx={{ color: getActionColor(action) }}>
            {getActionIcon(action)}
          </Typography>
          {power && (
            <Typography 
              variant="h6" 
              sx={{ 
                color: getActionColor(action),
                fontWeight: 'bold'
              }}
            >
              {power}
            </Typography>
          )}
        </Box>
        
        <Typography 
          variant="body2" 
          sx={{ 
            color: theme.palette.text.primary,
            textAlign: 'center',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}
        >
          {action}
        </Typography>

        {effect && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: theme.palette.text.secondary,
              textAlign: 'center',
              mt: 'auto'
            }}
          >
            {effect}
          </Typography>
        )}
      </Box>

      {/* Back face */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          bgcolor: theme.palette.grey[900],
          borderRadius: 2,
          border: '2px solid',
          borderColor: alpha(theme.palette.primary.light, 0.3),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography
          variant="h2"
          sx={{
            color: alpha(theme.palette.primary.light, 0.5),
            fontWeight: 'bold',
            userSelect: 'none'
          }}
        >
          ?
        </Typography>
      </Box>
    </Box>
  );
} 