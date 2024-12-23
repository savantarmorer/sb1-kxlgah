import { createContext, useReducer, ReactNode } from 'react';
import { User } from '../types/user';
import { BattleStats, BattleRatings } from '../types/battle';

interface GameState {
  user: User | null;
  battle_stats?: BattleStats;
  battle_ratings?: BattleRatings;
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

type GameAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_BATTLE_STATS'; payload: BattleStats }
  | { type: 'SET_BATTLE_RATINGS'; payload: BattleRatings };

const initialState: GameState = {
  user: null
};

export const GameContext = createContext<GameContextType | null>(null);

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_BATTLE_STATS':
      return { ...state, battle_stats: action.payload };
    case 'SET_BATTLE_RATINGS':
      return { ...state, battle_ratings: action.payload };
    default:
      return state;
  }
}

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}