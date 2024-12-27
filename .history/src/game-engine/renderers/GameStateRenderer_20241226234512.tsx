import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { GameStateEntity } from '../types';
import { CardRenderer } from './CardRenderer';

interface GameStateRendererProps {
  entity: GameStateEntity;
}

export const GameStateRenderer: React.FC<GameStateRendererProps> = ({ entity }) => {
  const theme = useTheme();
  const { phase, lastPlayedCards, winner } = entity;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        p: 2
      }}
    >
      <Typography variant="h5" color="primary">
        {phase}
      </Typography>

      {winner && (
        <Typography variant="h4" color="secondary">
          Winner: {winner}
        </Typography>
      )}

      {(lastPlayedCards.player || lastPlayedCards.opponent) && (
        <Box
          sx={{
            display: 'flex',
            gap: 4,
            alignItems: 'center',
            justifyContent: 'center',
            mt: 2
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Player</Typography>
            {lastPlayedCards.player && (
              <CardRenderer entity={lastPlayedCards.player} />
            )}
          </Box>

          <Typography variant="h6" color="primary">VS</Typography>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Opponent</Typography>
            {lastPlayedCards.opponent && (
              <CardRenderer entity={lastPlayedCards.opponent} />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}; 