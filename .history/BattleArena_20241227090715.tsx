import React from 'react';
import { Card } from './cardUtils';
import { Paper, Typography, Box, LinearProgress } from '@mui/material';

interface BattleArenaProps {
  playerHand: Card[];
  opponentHand: Card[];
  onCardPlay: (card: Card) => void;
  playerScore: number;
  opponentScore: number;
  currentTurn: 'player' | 'opponent';
  lastPlayedCards: {
    player: Card | null;
    opponent: Card | null;
  };
  turnTimer: number;
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  playerHand,
  opponentHand,
  onCardPlay,
  playerScore,
  opponentScore,
  currentTurn,
  lastPlayedCards,
  turnTimer,
}) => {
  return (
    <Box className="battle-arena" sx={{ p: 2, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Score Display */}
      <Paper elevation={3} sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6">Player: {playerScore}</Typography>
        <Typography variant="h6">Opponent: {opponentScore}</Typography>
      </Paper>

      {/* Turn Timer */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" align="center">
          {currentTurn === 'player' ? 'Your Turn' : "Opponent's Turn"}
        </Typography>
        {currentTurn === 'player' && (
          <Box sx={{ width: '100%', mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={(turnTimer / 30) * 100}
              color={turnTimer <= 5 ? 'error' : 'primary'}
            />
            <Typography variant="caption" align="center" display="block">
              {turnTimer}s
            </Typography>
          </Box>
        )}
      </Box>

      {/* Opponent's Hand */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Opponent's Hand
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          {opponentHand.map((card) => (
            <Paper
              key={card.id}
              elevation={3}
              sx={{
                width: 100,
                height: 140,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                transform: 'rotate(180deg)',
                bgcolor: 'grey.300',
              }}
            >
              <Typography variant="body2">?</Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Last Played Cards */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center', gap: 4 }}>
        {lastPlayedCards.opponent && (
          <Paper
            elevation={3}
            sx={{
              width: 120,
              height: 160,
              p: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="h6">{lastPlayedCards.opponent.name}</Typography>
            <Typography>Power: {lastPlayedCards.opponent.power}</Typography>
            <Typography variant="caption">{lastPlayedCards.opponent.action}</Typography>
          </Paper>
        )}
        {lastPlayedCards.player && (
          <Paper
            elevation={3}
            sx={{
              width: 120,
              height: 160,
              p: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="h6">{lastPlayedCards.player.name}</Typography>
            <Typography>Power: {lastPlayedCards.player.power}</Typography>
            <Typography variant="caption">{lastPlayedCards.player.action}</Typography>
          </Paper>
        )}
      </Box>

      {/* Player's Hand */}
      <Box sx={{ mt: 'auto' }}>
        <Typography variant="subtitle1" gutterBottom>
          Your Hand
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          {playerHand.map((card) => (
            <Paper
              key={card.id}
              elevation={3}
              sx={{
                width: 100,
                height: 140,
                p: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: currentTurn === 'player' ? 'pointer' : 'default',
                '&:hover': currentTurn === 'player' ? {
                  transform: 'translateY(-8px)',
                  transition: 'transform 0.2s',
                } : {},
                opacity: currentTurn === 'player' ? 1 : 0.7,
              }}
              onClick={() => currentTurn === 'player' && onCardPlay(card)}
            >
              <Typography variant="h6">{card.name}</Typography>
              <Typography>Power: {card.power}</Typography>
              <Typography variant="caption">{card.action}</Typography>
            </Paper>
          ))}
        </Box>
      </Box>
    </Box>
  );
}; 