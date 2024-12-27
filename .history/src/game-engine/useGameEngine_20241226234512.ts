import { useEffect, useRef, useState } from 'react';
import { GameEngine } from 'react-native-game-engine';
import { GameEntities, GameEvent, CardEntity, PlayerEntity, GameStateEntity } from './types';
import { TimerSystem, CardPlaySystem, PlayerSystem } from './systems';
import { BattleStateEnum } from '../types/battle';
import { Card } from '../utils/cardUtils';

interface UseGameEngineProps {
  playerName: string;
  opponentName: string;
  playerDeck: Card[];
  opponentDeck: Card[];
  onGameOver?: (winnerId: string) => void;
}

export const useGameEngine = ({
  playerName,
  opponentName,
  playerDeck,
  opponentDeck,
  onGameOver
}: UseGameEngineProps) => {
  const engineRef = useRef<GameEngine>(null);
  const [entities, setEntities] = useState<GameEntities>(() => {
    const initialEntities: GameEntities = {
      player: {
        id: 'player',
        type: 'player',
        name: playerName,
        hand: playerDeck.slice(0, 5).map((card, index) => ({
          id: `player-card-${index}`,
          type: 'card',
          card,
          isFlipped: false,
          isSelected: false,
          owner: 'player'
        })),
        deck: playerDeck.slice(5),
        score: 0,
        isReady: false,
        isMyTurn: true,
        timeLeft: 30
      } as PlayerEntity,
      opponent: {
        id: 'opponent',
        type: 'player',
        name: opponentName,
        hand: opponentDeck.slice(0, 5).map((card, index) => ({
          id: `opponent-card-${index}`,
          type: 'card',
          card,
          isFlipped: true,
          isSelected: false,
          owner: 'opponent'
        })),
        deck: opponentDeck.slice(5),
        score: 0,
        isReady: false,
        isMyTurn: false,
        timeLeft: 30
      } as PlayerEntity,
      timer: {
        id: 'timer',
        type: 'timer',
        turnTimeLeft: 30,
        matchTimeLeft: 300,
        isRunning: false
      },
      gameState: {
        id: 'gameState',
        type: 'gameState',
        phase: BattleStateEnum.PREPARING,
        currentTurn: 'player',
        lastPlayedCards: {
          player: null,
          opponent: null
        },
        winner: null
      } as GameStateEntity
    };

    return initialEntities;
  });

  useEffect(() => {
    const systems = [TimerSystem, CardPlaySystem, PlayerSystem];
    engineRef.current?.start();

    return () => {
      engineRef.current?.stop();
    };
  }, []);

  const handleEvent = (event: GameEvent) => {
    switch (event.type) {
      case 'CARD_SELECTED':
        const { cardId, playerId } = event.payload;
        const player = entities[playerId] as PlayerEntity;
        const selectedCard = player.hand.find(card => card.id === cardId);

        if (selectedCard) {
          const gameState = entities.gameState as GameStateEntity;
          if (playerId === 'player') {
            gameState.lastPlayedCards.player = selectedCard;
          } else {
            gameState.lastPlayedCards.opponent = selectedCard;
          }
          setEntities({ ...entities });
        }
        break;

      case 'TURN_ENDED':
        const { nextPlayerId } = event.payload;
        Object.values(entities).forEach(entity => {
          if (entity.type === 'player') {
            (entity as PlayerEntity).isMyTurn = entity.id === nextPlayerId;
          }
        });
        (entities.timer as any).turnTimeLeft = 30;
        setEntities({ ...entities });
        break;

      case 'GAME_OVER':
        const { winnerId } = event.payload;
        onGameOver?.(winnerId);
        break;

      case 'PLAYER_READY':
        const readyPlayer = entities[event.payload.playerId] as PlayerEntity;
        if (readyPlayer) {
          readyPlayer.isReady = true;
          setEntities({ ...entities });
        }
        break;

      case 'TIMER_TICK':
        // Timer updates are handled by the TimerSystem
        break;
    }
  };

  const selectCard = (cardId: string, playerId: string) => {
    handleEvent({
      type: 'CARD_SELECTED',
      payload: { cardId, playerId }
    });
  };

  const setPlayerReady = (playerId: string) => {
    handleEvent({
      type: 'PLAYER_READY',
      payload: { playerId }
    });
  };

  return {
    engineRef,
    entities,
    selectCard,
    setPlayerReady
  };
}; 