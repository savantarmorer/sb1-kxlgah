import { Card } from '../utils/cardUtils';
import { BattleStateEnum } from '../types/battle';

export interface GameEntity {
  id: string;
  type: 'card' | 'player' | 'timer' | 'gameState';
  position?: { x: number; y: number };
  renderer?: React.ComponentType<any>;
}

export interface CardEntity extends GameEntity {
  type: 'card';
  card: Card;
  isFlipped: boolean;
  isSelected: boolean;
  owner: string;
}

export interface PlayerEntity extends GameEntity {
  type: 'player';
  id: string;
  name: string;
  hand: CardEntity[];
  deck: Card[];
  score: number;
  isReady: boolean;
  isMyTurn: boolean;
  timeLeft: number;
}

export interface TimerEntity extends GameEntity {
  type: 'timer';
  turnTimeLeft: number;
  matchTimeLeft: number;
  isRunning: boolean;
}

export interface GameStateEntity extends GameEntity {
  type: 'gameState';
  phase: BattleStateEnum;
  currentTurn: string;
  lastPlayedCards: {
    player: CardEntity | null;
    opponent: CardEntity | null;
  };
  winner: string | null;
}

export interface GameEntities {
  [entityId: string]: GameEntity;
}

export type GameEvent = 
  | { type: 'CARD_SELECTED'; payload: { cardId: string; playerId: string } }
  | { type: 'TURN_ENDED'; payload: { nextPlayerId: string } }
  | { type: 'CARD_PLAYED'; payload: { cardId: string; playerId: string } }
  | { type: 'GAME_OVER'; payload: { winnerId: string } }
  | { type: 'PLAYER_READY'; payload: { playerId: string } }
  | { type: 'TIMER_TICK'; payload: { delta: number } };

export type GameSystem = (
  entities: GameEntities,
  { time, delta, dispatch }: { time: number; delta: number; dispatch: (event: GameEvent) => void }
) => GameEntities; 