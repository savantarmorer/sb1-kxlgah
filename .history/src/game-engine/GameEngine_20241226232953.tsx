import React from 'react';
import { Box } from '@mui/material';
import { GameEngine as RNGameEngine } from 'react-native-game-engine';
import { useGameEngine } from './useGameEngine';
import { CardRenderer, PlayerRenderer, GameStateRenderer, TimerRenderer } from './renderers';
import { GameEntity } from './types';
import { Card } from '../utils/cardUtils';

interface GameEngineProps {
  playerName: string;
  opponentName: string;
  playerDeck: Card[];
  opponentDeck: Card[];
  onGameOver?: (winnerId: string) => void;
}

export const GameEngine: React.FC<GameEngineProps> = ({
  playerName,
  opponentName,
  playerDeck,
  opponentDeck,
  onGameOver
}) => {
  const { engineRef, entities, selectCard, setPlayerReady } = useGameEngine({
    playerName,
    opponentName,
    playerDeck,
    opponentDeck,
    onGameOver
  });

  const renderEntity = (entity: GameEntity) => {
    switch (entity.type) {
      case 'card':
        return <CardRenderer entity={entity} />;
      case 'player':
        return (
          <PlayerRenderer
            entity={entity}
            onCardSelect={
              entity.id === 'player' ? (cardId) => selectCard(cardId, 'player') : undefined
            }
          />
        );
      case 'gameState':
        return <GameStateRenderer entity={entity} />;
      case 'timer':
        return <TimerRenderer entity={entity} />;
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 2
      }}
    >
      <Box sx={{ alignSelf: 'center' }}>
        {entities.timer && renderEntity(entities.timer)}
      </Box>

      <Box sx={{ alignSelf: 'center' }}>
        {entities.gameState && renderEntity(entities.gameState)}
      </Box>

      <Box sx={{ mt: 'auto' }}>
        {entities.opponent && renderEntity(entities.opponent)}
      </Box>

      <Box sx={{ mt: 'auto' }}>
        {entities.player && renderEntity(entities.player)}
      </Box>

      <RNGameEngine
        ref={engineRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none'
        }}
        entities={entities}
      />
    </Box>
  );
}; 