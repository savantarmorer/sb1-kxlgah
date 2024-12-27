import { renderHook, act } from '@testing-library/react-hooks';
import { GameProvider } from '../../contexts/GameContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { useBattle } from '../useBattle';
import { BattlePhase } from '../../types/battle';
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
    email: 'test@example.com'
  },
  isLoading: false,
  initialized: true
};

jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children)
}));

// Mock game state
const mockGameState = {
  user: {
    id: 'test-user-id',
    name: 'Test User'
  },
  battle: {
    status: 'preparing' as BattleStatus,
    phase: BattlePhase.PREPARING,
    questions: [],
    current_question: 0,
    total_questions: 0,
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
  }
};

jest.mock('../../contexts/GameContext', () => ({
  ...jest.requireActual('../../contexts/GameContext'),
  useGame: () => ({
    state: mockGameState,
    dispatch: jest.fn(),
    user: mockGameState.user
  }),
  GameProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children)
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

    expect(result.current.phase).toBe(BattlePhase.PREPARING);
    expect(result.current.playerState.health).toBe(50);
    expect(result.current.opponentState.health).toBe(50);
  });

  it('handles answer submission correctly', async () => {
    const { result } = renderHook(() => useBattle(), { wrapper: Wrapper });

    // Set up initial state
    act(() => {
      result.current.setPhase(BattlePhase.CARD_SELECTION);
      // @ts-ignore - we need to set this for testing
      result.current.currentQuestion = mockQuestion;
      // @ts-ignore - we need to set this for testing
      result.current.timeLeft = 30;
      // @ts-ignore - we need to set this for testing
      result.current.questions = [mockQuestion];
      // @ts-ignore - we need to set this for testing
      result.current.currentQuestionIndex = 0;
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

    act(() => {
      result.current.handleResolutionComplete();
    });

    expect(result.current.phase).toBe(BattlePhase.CARD_SELECTION);
  });

  it('initializes battle with correct mode', async () => {
    // Mock the supabase response
    const mockQuestionsData = [mockQuestion];
    const mockFrom = jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: mockQuestionsData, error: null }))
        }))
      }))
    }));

    // @ts-ignore - we need to mock this
    supabase.from = mockFrom;

    const { result } = renderHook(() => useBattle(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.initializeBattle('constitutional');
    });

    expect(result.current.phase).toBe(BattlePhase.DEALING);
  });
}); 