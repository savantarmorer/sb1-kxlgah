import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import { Shield, Sword, Repeat, Star } from 'lucide-react';
import { BattleActionType } from '../../types/battle';

export interface BattleCardProps {
  action: BattleActionType;
  power: number;
  effect?: string;
  isFlipped?: boolean;
  isWinner?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
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

export function BattleCard({ 
  action, 
  power, 
  effect,
  isFlipped = false,
  isWinner = false,
  isSelected = false,
  onClick
}: BattleCardProps) {
  const theme = useTheme();
  const Icon = actionIcons[action];
  const color = actionColors[action];

  return (
    <Box
      component={motion.div}
      whileHover={!isFlipped ? { 
        scale: 1.05,
        y: -10,
        transition: { duration: 0.2 }
      } : {}}
      animate={{
        scale: isSelected ? 1.1 : 1,
        y: isSelected ? -20 : 0,
        rotateY: isFlipped ? 180 : 0
      }}
      onClick={onClick}
      sx={{ 
        width: 120,
        height: 160,
        borderRadius: 2,
        bgcolor: isFlipped ? theme.palette.grey[900] : theme.palette.background.paper,
        border: '2px solid',
        borderColor: isSelected 
          ? color 
          : isFlipped 
            ? alpha(theme.palette.primary.light, 0.3)
            : alpha(color, 0.3),
        boxShadow: theme.shadows[4],
        cursor: onClick ? 'pointer' : 'default',
        perspective: 1000,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.6s',
        position: 'relative',
        '&:hover': onClick ? {
          borderColor: color,
          boxShadow: `0 0 15px ${alpha(color, 0.3)}`
        } : {}
      }}
    >
      {!isFlipped ? (
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Card Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color,
                textTransform: 'capitalize'
              }}
            >
              <Icon size={16} />
              <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                {action}
              </Typography>
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold',
                color
              }}
            >
              {power}
            </Typography>
          </Box>

          {/* Card Effect */}
          {effect && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                mt: 'auto',
                textAlign: 'center'
              }}
            >
              {effect}
            </Typography>
          )}

          {/* Winner Indicator */}
          {isWinner && (
            <Box
              sx={{
                position: 'absolute',
                top: -2,
                right: -2,
                bgcolor: theme.palette.warning.main,
                color: theme.palette.warning.contrastText,
                px: 1,
                py: 0.5,
                borderRadius: '0 4px 0 4px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
            >
              Winner
            </Box>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden'
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
      )}
    </Box>
  );
} 