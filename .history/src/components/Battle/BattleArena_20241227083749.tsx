import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, LinearProgress, useTheme, Paper } from '@mui/material';
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

const TURN_TIME_LIMIT = 30; // seconds

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
  const [timeLeft, setTimeLeft] = useState(TURN_TIME_LIMIT);
  const [showPowerComparison, setShowPowerComparison] = useState(false);

  // Turn timer
  useEffect(() => {
    if (currentTurn === 'opponent') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          // Auto-play a random card if time runs out
          if (playerHand.length > 0) {
            const randomCard = playerHand[Math.floor(Math.random() * playerHand.length)];
            onCardPlay(randomCard.id);
          }
          return TURN_TIME_LIMIT;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentTurn, playerHand, onCardPlay]);

  // Reset timer on turn change
  useEffect(() => {
    setTimeLeft(TURN_TIME_LIMIT);
  }, [currentTurn]);

  // Show power comparison when both cards are played
  useEffect(() => {
    if (lastPlayedCards?.player && lastPlayedCards?.opponent) {
      setShowPowerComparison(true);
      const timer = setTimeout(() => {
        setShowPowerComparison(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastPlayedCards]);

  const handleCardSelect = (cardId: string) => {
    if (currentTurn !== 'player') return;
    setSelectedCard(cardId === selectedCard ? undefined : cardId);
  };

  const handlePlayCard = () => {
    if (selectedCard) {
      onCardPlay(selectedCard);
      setSelectedCard(undefined);
    }
  };

  const calculatePower = (card: Card) => card.forca + card.poder;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        height: '100%',
        p: 3,
        position: 'relative'
      }}
    >
      {/* Timer Bar */}
      <LinearProgress
        variant="determinate"
        value={(timeLeft / TURN_TIME_LIMIT) * 100}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: theme.palette.grey[800],
          '& .MuiLinearProgress-bar': {
            backgroundColor: currentTurn === 'player' ? theme.palette.primary.main : theme.palette.error.main
          }
        }}
      />

      {/* Score Display */}
      <Paper
        elevation={3}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="primary" gutterBottom>
            You
          </Typography>
          <Typography variant="h4" color="primary">
            {score.player}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Time Left
          </Typography>
          <Typography variant="h4" color="text.primary">
            {timeLeft}s
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Opponent
          </Typography>
          <Typography variant="h4" color="error">
            {score.opponent}
          </Typography>
        </Box>
      </Paper>

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
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            alignItems: 'center',
            zIndex: 1
          }}
        >
          {!lastPlayedCards && (
            <>
              <Typography
                variant="h5"
                color={currentTurn === 'player' ? 'primary' : 'error'}
                sx={{ textShadow: '0 0 10px rgba(0,0,0,0.5)' }}
              >
                {currentTurn === 'player' ? 'Your Turn' : 'Opponent\'s Turn'}
              </Typography>
              {currentTurn === 'player' && selectedCard && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handlePlayCard}
                  sx={{
                    mt: 2,
                    px: 4,
                    py: 1,
                    borderRadius: 2,
                    boxShadow: theme.shadows[10]
                  }}
                >
                  Play Card
          <Typography
            variant="h5"
            color={currentTurn === 'player' ? 'primary' : 'error'}
          >
            {currentTurn === 'player' ? 'Your Turn' : 'Opponent\'s Turn'}
          </Typography>
          {currentTurn === 'player' && selectedCard && (
            <Button
              variant="contained"
              color="primary"
              onClick={handlePlayCard}
              sx={{ mt: 2 }}
            >
              Play Card
            </Button>
          )}
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