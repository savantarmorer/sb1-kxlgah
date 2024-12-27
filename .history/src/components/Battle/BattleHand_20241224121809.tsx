import React from 'react';
import { Box } from '@mui/material';
import { BattleCard } from './BattleCard';
import type { Card } from '../../utils/cardUtils';

export interface BattleHandProps {
  cards: Card[];
  selectedCard?: string;
  onCardSelect: (cardId: string) => void;
  isSelectable: boolean;
}

export function BattleHand({ cards, selectedCard, onCardSelect, isSelectable }: BattleHandProps) {
  return (
    <Box sx={{ 
      display: 'flex',
      justifyContent: 'center',
      gap: 2,
      mx: 'auto',
      maxWidth: 360
    }}>
      {cards.map((card) => (
        <BattleCard
          key={card.id}
          {...card}
          isFlipped={false}
          isSelected={card.id === selectedCard}
          onClick={() => isSelectable && onCardSelect(card.id)}
        />
      ))}
    </Box>
  );
} 