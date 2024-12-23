import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import { Sword, Shield, Gavel } from 'lucide-react';

interface BattleCardProps {
  isFlipped: boolean;
  isWinner: boolean;
  action: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'inicial': <Sword size={32} />,
  'contestacao': <Shield size={32} />,
  'reconvencao': <Gavel size={32} />
};

const ACTION_COLORS: Record<string, string> = {
  'inicial': '#FF4081', // Pink for attack
  'contestacao': '#2196F3', // Blue for defense
  'reconvencao': '#FF9800' // Orange for counter
};

export function BattleCard({ isFlipped, isWinner, action }: BattleCardProps) {
  const theme = useTheme();

  const getActionIcon = () => ACTION_ICONS[action] || '?';
  const getActionColor = () => ACTION_COLORS[action] || theme.palette.grey[500];

  return (
    <Box
      component={motion.div}
      initial={{ rotateY: 0 }}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      sx={{
        width: 120,
        height: 160,
        perspective: 1000,
        position: 'relative',
        cursor: 'pointer',
        transformStyle: 'preserve-3d',
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: isWinner ? `0 0 30px ${alpha(theme.palette.success.main, 0.6)}` : 'none'
        }
      }}
    >
      {/* Card Front */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          boxShadow: theme.shadows[4],
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          transform: 'rotateY(180deg)',
          zIndex: isFlipped ? 1 : 0,
          border: '2px solid',
          borderColor: alpha(getActionColor(), 0.5),
          '& svg': {
            color: getActionColor(),
            filter: `drop-shadow(0 0 8px ${alpha(getActionColor(), 0.4)})`
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1
          }}
        >
          {getActionIcon()}
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 'bold',
              color: getActionColor(),
              textShadow: `0 0 8px ${alpha(getActionColor(), 0.4)}`
            }}
          >
            {action.charAt(0).toUpperCase() + action.slice(1)}
          </Typography>
        </Box>
      </Box>

      {/* Card Back */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          backgroundColor: theme.palette.grey[900],
          borderRadius: 2,
          boxShadow: theme.shadows[4],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.palette.common.white,
          zIndex: isFlipped ? 0 : 1,
          background: `linear-gradient(135deg, 
            ${alpha(theme.palette.primary.dark, 0.9)}, 
            ${alpha(theme.palette.secondary.dark, 0.9)}
          )`,
          border: '2px solid',
          borderColor: alpha(theme.palette.common.white, 0.1)
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 900,
            color: alpha(theme.palette.common.white, 0.9),
            textShadow: `0 0 10px ${alpha(theme.palette.common.white, 0.5)}`
          }}
        >
          ?
        </Typography>
      </Box>
    </Box>
  );
} 