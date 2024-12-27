import React from 'react';
import { Box, Typography, Avatar, useTheme } from '@mui/material';
import { PlayerEntity } from '../types';
import { CardRenderer } from './CardRenderer';

interface PlayerRendererProps {
  entity: PlayerEntity;
  onCardSelect?: (cardId: string) => void;
}

export const PlayerRenderer: React.FC<PlayerRendererProps> = ({ entity, onCardSelect }) => {
  const theme = useTheme();
  const { name, score, hand, isMyTurn } = entity;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: isMyTurn ? theme.palette.primary.light : 'transparent',
        transition: 'background-color 0.3s'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Avatar sx={{ width: 48, height: 48 }}>{name[0]}</Avatar>
        <Box>
          <Typography variant="h6">{name}</Typography>
          <Typography>Score: {score}</Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}
      >
        {hand.map(card => (
          <CardRenderer
            key={card.id}
            entity={card}
            onSelect={onCardSelect ? () => onCardSelect(card.id) : undefined}
          />
        ))}
      </Box>
    </Box>
  );
}; 