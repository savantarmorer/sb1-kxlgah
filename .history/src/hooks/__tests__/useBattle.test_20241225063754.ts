import { renderHook, act } from '@testing-library/react-hooks';
import { GameProvider } from '../../contexts/GameContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { useBattle } from '../useBattle';
import { BattlePhase, BattleStatus } from '../../types/battle';
import React from 'react';
import { supabase } from '../../lib/supabase';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }
}));

const mockPlayerCard = {
  id: 'player-card-1',
  action: 'attack',
  power: 10,
  effect: null
};

const mockOpponentCard = {
  id: 'opponent-card-1',
  action: 'defense',
  power: 8,
  effect: null
};

const mockPlayerHand = [mockPlayerCard];
const mockOpponentHand = [mockOpponentCard];

const mockQuestion = {
  id: 1,
  question: 'Test question?',
  alternative_a: 'A',
  alternative_b: 'B',
  alternative_c: 'C',
  alternative_d: 'D',
  correct_answer: 'A',
  category: 'test',
  difficulty: 'easy'
};

// Mock auth state
const mockAuthState = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@test.com'
  },
  isLoading: false,
  initialized: true,
  isAuthenticated: true
};

jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => mockAuthState
}));

// Mock game state
const mockGameState = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@test.com',
    streak: 0
  },
  battle: {
    status: 'preparing' as BattleStatus,
    phase: BattlePhase.PREPARING,
    questions: [mockQuestion],
    current_question: 0,
    total_questions: 1,
    time_left: 30,
    time_per_question: 30,
    score: { player: 0, opponent: 0 },
    player_answers: [],
    opponent: null,
    in_progress: false,
    player_state: {
      health: 50,
      shield: 0,
      isReady: false
    },
    opponent_state: {
      health: 50,
      shield: 0,
      isReady: false
    },
    metadata: {
      is_bot: true,
      difficulty: 'medium' as const,
      mode: 'practice' as const
    }
  },
  battle_stats: {
    total_battles: 0,
    wins: 0,
    losses: 0,
    win_streak: 0,
    highest_streak: 0,
    total_xp_earned: 0,
    total_coins_earned: 0
  },
  loading: false
};

// Mock dispatch function that updates the state
const mockDispatch = jest.fn((action) => {
  switch (action.type) {
    case 'SET_BATTLE_PHASE':
      mockGameState.battle.phase = action.payload;
      break;
    case 'INITIALIZE_BATTLE':
      mockGameState.battle = {
        ...mockGameState.battle,
        ...action.payload,
        phase: BattlePhase.DEALING
      };
      break;
    case 'ANSWER_QUESTION':
      mockGameState.battle.phase = BattlePhase.RESOLUTION;
      break;
    case 'SET_BATTLE_STATUS':
      mockGameState.battle.status = action.payload;
      break;
  }
});

jest.mock('../../contexts/GameContext', () => ({
  ...jest.requireActual('../../contexts/GameContext'),
  useGame: () => ({
    state: mockGameState,
    dispatch: mockDispatch,
    user: mockGameState.user
  })
}));

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return React.createElement(NotificationProvider, null,
    React.createElement(AuthProvider, null,
      React.createElement(GameProvider, null, children)
    )
  );
};

describe('useBattle Hook', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes battle state correctly', () => {
    const { result } = renderHook(() => useBattle(), { wrapper: Wrapper });

    // Wait for the hook to be ready
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.phase).toBe(BattlePhase.PREPARING);
    expect(result.current.playerState.health).toBe(50);
    expect(result.current.opponentState.health).toBe(50);
  });

  it('handles answer submission correctly', async () => {
    const { result } = renderHook(() => useBattle(), { wrapper: Wrapper });

    // Wait for the hook to be ready
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Set up initial state
    act(() => {
      result.current.setPhase(BattlePhase.CARD_SELECTION);
    });

    // Submit answer
    await act(async () => {
      await result.current.handleAnswer('alternative_A', mockPlayerCard.id, mockOpponentCard.id, mockPlayerHand, mockOpponentHand);
      // Wait for state updates
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Verify phase transition
    expect(result.current.phase).toBe(BattlePhase.RESOLUTION);
    expect(result.current.isAnswerCorrect).toBe(true);
    expect(result.current.selectedAnswer).toBe('alternative_A');
  });

  it('handles resolution completion correctly', () => {
    const { result } = renderHook(() => useBattle(), { wrapper: Wrapper });

    // Wait for the hook to be ready
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    act(() => {
      result.current.handleResolutionComplete();
    });

    expect(result.current.phase).toBe(BattlePhase.CARD_SELECTION);
  });

  it('initializes battle with correct mode', async () => {
    const { result } = renderHook(() => useBattle(), { wrapper: Wrapper });

    // Wait for the hook to be ready
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await act(async () => {
      await result.current.initializeBattle('constitutional');
    });

    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'INITIALIZE_BATTLE',
      payload: expect.objectContaining({
        mode: 'constitutional'
      })
    }));
  });
}); 