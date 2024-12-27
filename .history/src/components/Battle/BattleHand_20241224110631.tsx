import React from 'react';
import { Box, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import type { Card } from '../../utils/cardUtils';
import { BattleCard } from './BattleCard';

interface BattleHandProps {
  cards: Card[];
  selectedCard?: string;
  onSelectCard: (cardId: string) => void;
  isDisabled?: boolean;
}

const CARD_WIDTH = 120;
const CARD_OVERLAP = 30; // Amount of overlap between cards

export function BattleHand({ cards, selectedCard, onSelectCard, isDisabled }: BattleHandProps) {
  const theme = useTheme();

  return (
    <Box sx={{ 
      display: 'flex',
      position: 'relative',
      height: 180, // Extra height for hover animation
      width: 'fit-content',
      mx: 'auto'
    }}>
      {cards.map((card, index) => (
        <Box
          component={motion.div}
          key={card.id}
          onClick={() => !isDisabled && onSelectCard(card.id)}
          initial={false}
          whileHover={!isDisabled ? { 
            y: -20,
            scale: 1.1,
            zIndex: 10,
            transition: { duration: 0.2 }
          } : {}}
          animate={{
            scale: selectedCard === card.id ? 1.1 : 1,
            y: selectedCard === card.id ? -20 : 0,
            zIndex: selectedCard === card.id ? 10 : index,
          }}
          sx={{
            position: 'relative',
            ml: index === 0 ? 0 : `-${CARD_OVERLAP}px`,
            cursor: isDisabled ? 'default' : 'pointer',
            filter: selectedCard && selectedCard !== card.id ? 'brightness(0.7)' : 'none',
            transition: 'filter 0.3s ease',
            '&:hover': !isDisabled ? {
              filter: 'brightness(1.1)',
            } : {}
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
      ))}
    </Box>
  );
} 