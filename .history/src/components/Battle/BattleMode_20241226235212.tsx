import React from 'react';
import { Box } from '@mui/material';
import { useGame } from '../../contexts/GameContext';
import { GameEngine } from '../../game-engine';
import { createDeck } from '../../utils/cardUtils';

interface BattleModeProps {
  on_close?: () => void;
}

export default function BattleMode({ on_close }: BattleModeProps) {
  const { state: gameState } = useGame();

  // Initialize decks based on roles
  const playerDeck = createDeck(gameState.battle?.player_role || 'default');
  const opponentDeck = createDeck(gameState.battle?.opponent_role || 'default');

  const handleGameOver = (winnerId: string) => {
    if (winnerId === 'player') {
      // Handle player victory
      console.log('Player wins!');
    } else {
      // Handle opponent victory
      console.log('Opponent wins!');
    }
    on_close?.();
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <GameEngine
        playerName={gameState.user?.username || 'Player'}
        opponentName={gameState.battle?.opponent_name || 'Opponent'}
        playerDeck={playerDeck}
        opponentDeck={opponentDeck}
        onGameOver={handleGameOver}
      />
    </Box>
  );
}