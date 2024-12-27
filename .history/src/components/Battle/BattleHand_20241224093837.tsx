import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { BattleCard } from './BattleCard';
import type { BattleAction } from '../../types/battle';

interface BattleHandProps {
  cards: Array<{
    id: string;
    action: BattleAction;
    power?: number;
    effect?: string;
  }>;
  selectedCard: string | null;
  onSelectCard: (cardId: string) => void;
  isDisabled?: boolean;
}

const cardVariants = {
  initial: (index: number) => ({
    opacity: 0,
    y: 50,
    rotateZ: index % 2 === 0 ? -5 : 5,
  }),
  animate: (index: number) => ({
    opacity: 1,
    y: 0,
    rotateZ: index % 2 === 0 ? -2 : 2,
    transition: {
      duration: 0.3,
      delay: index * 0.1,
    },
  }),
  exit: (index: number) => ({
    opacity: 0,
    y: -50,
    rotateZ: index % 2 === 0 ? -5 : 5,
    transition: {
      duration: 0.2,
    },
  }),
  hover: {
    y: -20,
    scale: 1.1,
    rotateZ: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export function BattleHand({ cards, selectedCard, onSelectCard, isDisabled = false }: BattleHandProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        minHeight: 200,
        position: 'relative',
        perspective: 1000,
      }}
    >
      <AnimatePresence mode="wait">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            custom={index}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            whileHover={!isDisabled ? "hover" : undefined}
            style={{
              position: 'relative',
              cursor: isDisabled ? 'default' : 'pointer',
            }}
            onClick={() => !isDisabled && onSelectCard(card.id)}
          >
            <Box
              sx={{
                transform: `translateX(${(index - (cards.length - 1) / 2) * 60}px)`,
                position: 'absolute',
                filter: selectedCard === card.id 
                  ? `drop-shadow(0 0 10px ${alpha(theme.palette.primary.main, 0.5)})`
                  : 'none',
                opacity: isDisabled ? 0.7 : 1,
              }}
            >
              <BattleCard
                isFlipped={false}
                isWinner={false}
                action={card.action}
                power={card.power}
                effect={card.effect}
              />
            </Box>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {cards.length === 0 && (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontStyle: 'italic' }}
        >
          No cards in hand
        </Typography>
      )}
    </Box>
  );
} 