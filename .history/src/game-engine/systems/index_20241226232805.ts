import { GameSystem, GameEntities, GameEvent, PlayerEntity, CardEntity, GameStateEntity } from '../types';
import { BattleStateEnum } from '../../types/battle';

export const TimerSystem: GameSystem = (entities, { delta, dispatch }) => {
  const timer = Object.values(entities).find(e => e.type === 'timer');
  const gameState = Object.values(entities).find(e => e.type === 'gameState') as GameStateEntity;
  
  if (!timer || !gameState || gameState.phase === BattleStateEnum.COMPLETED) {
    return entities;
  }

  if (timer.isRunning) {
    timer.turnTimeLeft -= delta;
    timer.matchTimeLeft -= delta;

    if (timer.turnTimeLeft <= 0) {
      dispatch({ type: 'TURN_ENDED', payload: { nextPlayerId: getNextPlayer(entities, gameState.currentTurn) } });
    }

    dispatch({ type: 'TIMER_TICK', payload: { delta } });
  }

  return entities;
};

export const CardPlaySystem: GameSystem = (entities, { dispatch }) => {
  const gameState = Object.values(entities).find(e => e.type === 'gameState') as GameStateEntity;
  
  if (!gameState || gameState.phase !== BattleStateEnum.CARD_SELECTION) {
    return entities;
  }

  // Check if both players have played their cards
  if (gameState.lastPlayedCards.player && gameState.lastPlayedCards.opponent) {
    const { player, opponent } = gameState.lastPlayedCards;
    const playerEntity = Object.values(entities).find(
      e => e.type === 'player' && e.id === player.owner
    ) as PlayerEntity;
    const opponentEntity = Object.values(entities).find(
      e => e.type === 'player' && e.id === opponent.owner
    ) as PlayerEntity;

    if (playerEntity && opponentEntity) {
      // Compare cards and update scores
      if (player.card.forca > opponent.card.forca) {
        playerEntity.score += 1;
      } else if (opponent.card.forca > player.card.forca) {
        opponentEntity.score += 1;
      } else {
        if (player.card.poder > opponent.card.poder) {
          playerEntity.score += 1;
        } else if (opponent.card.poder > player.card.poder) {
          opponentEntity.score += 1;
        }
      }

      // Check for game over
      if (playerEntity.score >= 3 || opponentEntity.score >= 3) {
        gameState.phase = BattleStateEnum.COMPLETED;
        gameState.winner = playerEntity.score >= 3 ? playerEntity.id : opponentEntity.id;
        dispatch({ 
          type: 'GAME_OVER', 
          payload: { winnerId: gameState.winner }
        });
      } else {
        // Reset for next round
        gameState.lastPlayedCards = { player: null, opponent: null };
        dispatch({ 
          type: 'TURN_ENDED', 
          payload: { nextPlayerId: getNextPlayer(entities, gameState.currentTurn) }
        });
      }
    }
  }

  return entities;
};

export const PlayerSystem: GameSystem = (entities, { dispatch }) => {
  const gameState = Object.values(entities).find(e => e.type === 'gameState') as GameStateEntity;
  
  if (!gameState || gameState.phase === BattleStateEnum.COMPLETED) {
    return entities;
  }

  // Check if all players are ready
  const players = Object.values(entities).filter(e => e.type === 'player') as PlayerEntity[];
  const allReady = players.every(p => p.isReady);

  if (allReady && gameState.phase === BattleStateEnum.PREPARING) {
    gameState.phase = BattleStateEnum.CARD_SELECTION;
    gameState.currentTurn = players[0].id;
  }

  return entities;
};

function getNextPlayer(entities: GameEntities, currentPlayerId: string): string {
  const players = Object.values(entities).filter(e => e.type === 'player') as PlayerEntity[];
  const currentIndex = players.findIndex(p => p.id === currentPlayerId);
  return players[(currentIndex + 1) % players.length].id;
} 