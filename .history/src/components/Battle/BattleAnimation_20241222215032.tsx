import React from 'react';
import { Box, Typography, Avatar, useTheme, alpha } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Sword, FileText, Scale } from 'lucide-react';

interface BattleAnimationProps {
  attacker: 'player' | 'opponent';
  damage: number;
  playerAvatar?: string;
  opponentAvatar: string;
  shieldBlock?: number;
  shieldBreak?: number;
  playerAction?: 'inicial' | 'contestacao' | 'reconvencao';
  opponentAction?: 'inicial' | 'contestacao' | 'reconvencao';
}

const ActionCard = ({ 
  action, 
  isRevealed, 
  isWinner,
  side = 'left'
}: { 
  action?: 'inicial' | 'contestacao' | 'reconvencao';
  isRevealed: boolean;
  isWinner: boolean;
  side?: 'left' | 'right';
}) => {
  const theme = useTheme();

  const getActionIcon = () => {
    switch (action) {
      case 'inicial': return <FileText size={32} />;
      case 'contestacao': return <Shield size={32} />;
      case 'reconvencao': return <Scale size={32} />;
      default: return <Sword size={32} />;
    }
  };

  const getActionName = () => {
    switch (action) {
      case 'inicial': return 'Inicial';
      case 'contestacao': return 'Contestação';
      case 'reconvencao': return 'Reconvenção';
      default: return '???';
    }
  };

  return (
    <motion.div
      initial={{ 
        rotateY: side === 'left' ? -180 : 180,
        scale: 0,
        y: -100
      }}
      animate={{ 
        rotateY: isRevealed ? 0 : (side === 'left' ? -180 : 180),
        scale: 1,
        y: 0,
        boxShadow: isWinner 
          ? [
              '0 0 0 rgba(255,255,255,0)',
              '0 0 30px rgba(255,215,0,0.8)',
              '0 0 0 rgba(255,255,255,0)'
            ]
          : '0 4px 12px rgba(0,0,0,0.1)'
      }}
      transition={{ 
        duration: 0.6,
        boxShadow: { 
          duration: 1.5,
          repeat: isWinner ? Infinity : 0,
          repeatType: 'reverse'
        }
      }}
      style={{
        width: 160,
        height: 220,
        borderRadius: 16,
        backgroundColor: theme.palette.background.paper,
        position: 'relative',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Card Front */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 2,
          border: '2px solid',
          borderColor: isWinner ? 'warning.main' : 'divider',
          borderRadius: 4,
          bgcolor: isWinner ? alpha(theme.palette.warning.main, 0.1) : 'background.paper'
        }}
      >
        <Box
          sx={{
            color: isWinner ? 'warning.main' : 'text.primary',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1
          }}
        >
          {getActionIcon()}
          <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
            {getActionName()}
          </Typography>
        </Box>
      </Box>

      {/* Card Back */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          border: '2px solid',
          borderColor: 'divider',
          borderRadius: 4,
          bgcolor: 'background.paper',
          backgroundImage: `radial-gradient(circle at center, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          component={motion.div}
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear'
          }}
          sx={{
            color: alpha(theme.palette.primary.main, 0.3),
            transform: 'scale(2)'
          }}
        >
          <Scale size={32} />
        </Box>
      </Box>

      {/* Winner Effect */}
      {isWinner && (
        <Box
          component={motion.div}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
          sx={{
            position: 'absolute',
            inset: -20,
            border: '2px solid',
            borderColor: 'warning.main',
            borderRadius: 4,
            boxShadow: `0 0 30px ${alpha(theme.palette.warning.main, 0.5)}`,
            zIndex: -1
          }}
        />
      )}
    </motion.div>
  );
};

export function BattleAnimation({ 
  attacker, 
  damage, 
  playerAvatar, 
  opponentAvatar,
  shieldBlock,
  shieldBreak,
  playerAction,
  opponentAction
}: BattleAnimationProps) {
  const theme = useTheme();
  const [showCards, setShowCards] = React.useState(true);
  const [revealCards, setRevealCards] = React.useState(false);

  React.useEffect(() => {
    // Start reveal animation after cards are placed
    const revealTimer = setTimeout(() => {
      setRevealCards(true);
    }, 1000);

    // Hide cards before attack animation
    const hideTimer = setTimeout(() => {
      setShowCards(false);
    }, 2500);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: alpha(theme.palette.background.paper, 0.95),
        backdropFilter: 'blur(8px)',
        zIndex: 10,
        overflow: 'hidden'
      }}
    >
      {/* Battle Arena */}
      <Box sx={{ 
        display: 'flex', 
        gap: 12, 
        alignItems: 'center', 
        position: 'relative',
        minHeight: 400
      }}>
        {/* Cards Section */}
        {showCards && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <ActionCard
              action={playerAction}
              isRevealed={revealCards}
              isWinner={attacker === 'player'}
              side="left"
            />
            <Box sx={{ minWidth: 100 }} />
            <ActionCard
              action={opponentAction}
              isRevealed={revealCards}
              isWinner={attacker === 'opponent'}
              side="right"
            />
          </Box>
        )}

        {/* Attack Animation */}
        {!showCards && (
          <>
            {/* Rest of the battle animation code */}
          </>
        )}
      </Box>
    </Box>
  );
} 