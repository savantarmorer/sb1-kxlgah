import React, { createContext, useContext, useReducer } from 'react';
import { BattleState, BattleStatus } from '../types/battle';
import { BATTLE_CONFIG } from '../config/battleConfig';

interface BattleContextType {
  state: BattleState;
  dispatch: React.Dispatch<BattleAction>;
}

export type BattleAction =
  | { type: 'START_BATTLE' }
  | { type: 'SET_STATUS'; payload: BattleStatus }
  | { type: 'INITIALIZE_BATTLE'; payload: { questions: any[]; timePerQuestion: number } }
  | { type: 'UPDATE_BATTLE_PROGRESS'; payload: any }
  | { type: 'ADVANCE_QUESTION'; payload: number }
  | { type: 'SET_TIME_LEFT'; payload: number }
  | { type: 'END_BATTLE'; payload: any }
  | { type: 'RESET_BATTLE' };

const initialState: BattleState = {
  status: 'searching',
  inProgress: false,
  questions: [],
  currentQuestion: 0,
  score: { player: 0, opponent: 0 },
  timeLeft: BATTLE_CONFIG.timePerQuestion,
  timePerQuestion: BATTLE_CONFIG.timePerQuestion,
  playerAnswers: []
};

const BattleContext = createContext<BattleContextType | undefined>(undefined);

export function BattleProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(battleReducer, initialState);

  return (
    <BattleContext.Provider value={{ state, dispatch }}>
      {children}
    </BattleContext.Provider>
  );
}

export function useBattleContext() {
  const context = useContext(BattleContext);
  if (context === undefined) {
    throw new Error('useBattleContext must be used within a BattleProvider');
  }
  return context;
}

function battleReducer(state: BattleState, action: BattleAction): BattleState {
  switch (action.type) {
    case 'START_BATTLE':
      return {
        ...initialState,
        inProgress: true
      };
    case 'SET_STATUS':
      return {
        ...state,
        status: action.payload,
        timeLeft: action.payload === 'battle' ? BATTLE_CONFIG.timePerQuestion : state.timeLeft
      };
    case 'INITIALIZE_BATTLE':
      return {
        ...state,
        questions: action.payload.questions,
        timePerQuestion: action.payload.timePerQuestion,
        currentQuestion: 0,
        playerAnswers: [],
        score: { player: 0, opponent: 0 }
      };
    // ... add other cases as needed
    default:
      return state;
  }
}

/**
 * Role: Battle state management
 * 
 * Dependencies:
 * - Battle types
 * - Battle configuration
 * 
 * Used by:
 * - Battle components
 * - Game system
 * 
 * Features:
 * - Centralized battle state
 * - Type-safe actions
 * - Battle flow control
 * 
 * Scalability:
 * - Easy to add new actions
 * - Proper state isolation
 * - Clear state updates
 */

