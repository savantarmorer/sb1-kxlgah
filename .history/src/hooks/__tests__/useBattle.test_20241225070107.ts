import { renderHook } from '@testing-library/react-hooks';
import { useBattle } from '../useBattle';
import { BattlePhase } from '../../types/battle';
import { GameProvider } from '../../contexts/GameContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { SoundProvider } from '../../contexts/SoundContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
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
    }
  },
  user: {
    id: '1',
    name: 'Test User',
    email: 'test@test.com',
    level: 1,
    xp: 0,
    coins: 0
  }
};

const mockAuthState = {
  user: {
    id: '1',
    name: 'Test User',
    email: 'test@test.com'
  },
  isAuthenticated: true
};

// Mock the useGame hook
jest.mock('../../contexts/GameContext', () => ({
  ...jest.requireActual('../../contexts/GameContext'),
  useGame: () => ({
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
    getRewards: () => ({
      xp_earned: 100,
      coins_earned: 50,
      streak_bonus: 0,
      time_bonus: 0,
      total_xp: 100,
      total_coins: 50
    })
  })
}));

// Mock the useAuth hook
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => mockAuthState
}));

// Mock the useSound hook
jest.mock('../../contexts/SoundContext', () => ({
  ...jest.requireActual('../../contexts/SoundContext'),
  useSound: () => ({
    playSound: jest.fn(),
    stopSound: jest.fn(),
    isSoundEnabled: true
  })
}));

// Mock the useLanguage hook
jest.mock('../../contexts/LanguageContext', () => ({
  ...jest.requireActual('../../contexts/LanguageContext'),
  useLanguage: () => ({
    language: 'en',
    setLanguage: jest.fn()
  })
}));

// Mock the useNotification hook
jest.mock('../../contexts/NotificationContext', () => ({
  ...jest.requireActual('../../contexts/NotificationContext'),
  useNotification: () => ({
    showNotification: jest.fn(),
    hideNotification: jest.fn()
  })
}));

describe('useBattle Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct state', () => {
    const { result } = renderHook(() => useBattle());

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
    const { result } = renderHook(() => useBattle());

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