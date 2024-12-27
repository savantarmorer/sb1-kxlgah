import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { BattleHand } from './BattleHand';
import { BattleCard } from './BattleCard';
import type { Card } from '../../utils/cardUtils';
import { BattleScore } from '../../types/battle';

interface BattleArenaProps {
  playerHand: Card[];
  opponentHand: Card[];
  onCardPlay: (cardId: string) => void;
  score: BattleScore;
  currentTurn: 'player' | 'opponent';
  lastPlayedCards?: {
    player?: Card;
    opponent?: Card;
  };
}

export function BattleArena({
  playerHand,
  opponentHand,
  onCardPlay,
  score,
  currentTurn,
  lastPlayedCards
}: BattleArenaProps) {
  const theme = useTheme();
  const [selectedCard, setSelectedCard] = useState<string>();

  const handleCardSelect = (cardId: string) => {
    if (currentTurn !== 'player') return;
    setSelectedCard(cardId);
  };

  const handleCardPlay = () => {
    if (selectedCard) {
      onCardPlay(selectedCard);
      setSelectedCard(undefined);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        height: '100%',
        p: 3
      }}
    >
      {/* Score Display */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" color="primary">
          You: {score.player}
        </Typography>
        <Typography variant="h6" color="error">
          Opponent: {score.opponent}
        </Typography>
      </Box>

      {/* Opponent's Hand */}
      <Box sx={{ transform: 'rotate(180deg)' }}>
        <BattleHand
          cards={opponentHand}
          isSelectable={false}
          onCardSelect={() => {}}
        />
      </Box>

      {/* Battle Arena Center */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          position: 'relative'
        }}
      >
        {/* Turn Indicator */}
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}
        >
          <Typography
            variant="h5"
            color={currentTurn === 'player' ? 'primary' : 'error'}
          >
            {currentTurn === 'player' ? 'Your Turn' : 'Opponent\'s Turn'}
          </Typography>
        </Box>

        {/* Last Played Cards */}
        <AnimatePresence mode="wait">
          {lastPlayedCards && (
            <>
              {lastPlayedCards.player && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                >
                  <BattleCard
                    action={lastPlayedCards.player.type === 'promotoria' ? 'attack' : 'defense'}
                    power={lastPlayedCards.player.forca}
                    effect={lastPlayedCards.player.name}
                    isFlipped={false}
                  />
                </motion.div>
              )}
              {lastPlayedCards.opponent && (
                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                >
                  <BattleCard
                    action={lastPlayedCards.opponent.type === 'promotoria' ? 'attack' : 'defense'}
                    power={lastPlayedCards.opponent.forca}
                    effect={lastPlayedCards.opponent.name}
                    isFlipped={false}
                  />
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </Box>

      {/* Player's Hand */}
      <Box>
        <BattleHand
          cards={playerHand}
          selectedCard={selectedCard}
          onCardSelect={handleCardSelect}
          isSelectable={currentTurn === 'player'}
        />
      </Box>
    </Box>
  );
} 