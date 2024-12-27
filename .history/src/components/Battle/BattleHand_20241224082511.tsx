import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { BattleCard as BattleCardComponent } from './BattleCard';
import { BattleCard, PlayerHand } from '../../types/battle';
import { BATTLE_CONFIG } from '../../config/battleConfig';

interface BattleHandProps {
  hand: PlayerHand;
  isOpponent?: boolean;
  onSelectCard?: (card: BattleCard) => void;
  selectedCard?: BattleCard | null;
  isSelectionPhase: boolean;
}

const containerVariants = {
  hidden: {
    opacity: 0,
    y: 50
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.8
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: BATTLE_CONFIG.cards.animation_duration / 1000
    }
  }
};

export const BattleHand: React.FC<BattleHandProps> = ({
  hand,
  isOpponent = false,
  onSelectCard,
  selectedCard,
  isSelectionPhase
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          color: theme.palette.text.secondary,
          fontWeight: 'bold'
        }}
      >
        {isOpponent ? 'Opponent\'s Hand' : 'Your Hand'}
      </Typography>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          padding: '1rem',
          width: '100%',
          maxWidth: 800,
          position: 'relative'
        }}
      >
        <AnimatePresence>
          {hand.cards.map((card, index) => (
            <motion.div
              key={card.id}
              variants={cardVariants}
              style={{
                position: 'relative',
                transformOrigin: 'bottom'
              }}
            >
              <BattleCardComponent
                card={isOpponent ? undefined : card}
                showBack={isOpponent}
                isSelected={selectedCard?.id === card.id}
                isPlayable={!isOpponent && isSelectionPhase && !card.isUsed}
                onClick={() => !isOpponent && onSelectCard?.(card)}
              />
              {!isOpponent && card.isUsed && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: alpha(theme.palette.background.paper, 0.8),
                    borderRadius: 2,
                    color: theme.palette.text.secondary,
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    zIndex: 2
                  }}
                >
                  USED
                </Box>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </Box>
  );
}; 