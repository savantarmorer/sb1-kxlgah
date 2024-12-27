import { renderHook } from '@testing-library/react-hooks';
import { useBattle } from '../useBattle';
import { BattlePhase } from '../../types/battle';
import { GameContext, GameContextType } from '../../contexts/GameContext';
import React from 'react';

// Mock state
const mockGameState = {
  battle: {
    phase: BattlePhase.PREPARING,
    status: 'IN_PROGRESS',
    questions: [
      {
        id: '1',
        question: 'Test question',
        answers: ['A', 'B', 'C', 'D'],
        correct_answer: 0
      }
    ],
    current_question: 0,
    total_questions: 1,
    time_left: 30,
    time_per_question: 30,
    score: 0,
    player_answers: [],
    opponent: {
      id: '2',
      name: 'Test Opponent',
      email: 'opponent@test.com'
    },
    in_progress: true,
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
      player_deck: [],
      opponent_deck: []
    },
    rewards: {
      xp_earned: 100,
      coins_earned: 50,
      streak_bonus: 0,
      time_bonus: 0,
      total_xp: 100,
      total_coins: 50
    }
  },
  user: {
    id: '1',
    name: 'Test User',
    email: 'test@test.com',
    level: 1,
    xp: 0,
    coins: 0,
    streak: 0
  },
  battle_stats: {
    total_battles: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    current_streak: 0,
    best_streak: 0,
    total_xp_earned: 0,
    total_coins_earned: 0
  }
};

const mockGameContext: GameContextType = {
  state: mockGameState,
  dispatch: jest.fn(),
  loading: false,
  initialized: true,
  getCurrentQuestion: () => mockGameState.battle.questions[0],
  getBattleStatus: () => mockGameState.battle.status,
  getBattleProgress: () => ({
    currentQuestion: mockGameState.battle.current_question,
    totalQuestions: mockGameState.battle.total_questions,
    timeLeft: mockGameState.battle.time_left,
    score: { player: 0, opponent: 0 }
  }),
  getRewards: () => mockGameState.battle.rewards
};

// Mock the hooks
jest.mock('../../contexts/GameContext', () => ({
  ...jest.requireActual('../../contexts/GameContext'),
  useGame: () => mockGameContext
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@test.com'
    },
    isAuthenticated: true,
    isLoading: false,
    initialized: true
  })
}));

jest.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn()
  })
}));

jest.mock('../../contexts/LanguageContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

jest.mock('../useBattleSound', () => ({
  useBattleSound: () => ({
    play_sound: jest.fn(),
    stop_sound: jest.fn()
  })
}));

jest.mock('../useAchievements', () => ({
  useAchievements: () => ({
    check_achievements: jest.fn()
  })
}));

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <GameContext.Provider value={mockGameContext}>
    {children}
  </GameContext.Provider>
);

describe('useBattle Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct state', () => {
    const { result } = renderHook(() => useBattle(), { wrapper: Wrapper });

    expect(result.current.phase).toBe(BattlePhase.PREPARING);
    expect(result.current.playerState).toEqual({
      health: 50,
      shield: 0,
      isReady: false
    });
    expect(result.current.opponentState).toEqual({
      health: 50,
      shield: 0,
      isReady: false
    });
  });

  it('returns battle rewards', () => {
    const { result } = renderHook(() => useBattle(), { wrapper: Wrapper });

    const rewards = result.current.getBattleRewards();

    expect(rewards).toEqual({
      xp_earned: 100,
      coins_earned: 50,
      streak_bonus: 0,
      time_bonus: 0,
      total_xp: 100,
      total_coins: 50
    });
  });
}); 