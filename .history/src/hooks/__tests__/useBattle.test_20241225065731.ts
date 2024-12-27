import { renderHook, act } from '@testing-library/react-hooks';
import { GameProvider } from '../../contexts/GameContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { useBattle } from '../useBattle';
import { BattlePhase, BattleStatus } from '../../types/battle';
import React from 'react';
import { supabase } from '../../lib/supabase';
import { AuthProvider } from '../../contexts/AuthContext';
import { SoundProvider } from '../../contexts/SoundContext';
import { LanguageProvider } from '../../contexts/LanguageContext';

// Mock HTMLMediaElement
window.HTMLMediaElement.prototype.load = jest.fn();
window.HTMLMediaElement.prototype.play = jest.fn();
window.HTMLMediaElement.prototype.pause = jest.fn();

// Mock Audio class
class AudioMock {
  load = jest.fn();
  play = jest.fn();
  pause = jest.fn();
}

// @ts-ignore
global.Audio = AudioMock;

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

// Mock sound context
jest.mock('../../contexts/SoundContext', () => ({
  ...jest.requireActual('../../contexts/SoundContext'),
  useSoundContext: () => ({
    play_sound: jest.fn(),
    stop_sound: jest.fn(),
    is_muted: false,
    toggle_mute: jest.fn()
  }),
  SoundProvider: ({ children }: { children: React.ReactNode }) => children
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
  isAuthenticated: true,
  session: {
    user: {
      id: 'test-user-id',
      email: 'test@test.com'
    }
  }
};

// Mock notification functions
const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
const mockShowInfo = jest.fn();

jest.mock('../../contexts/NotificationContext', () => ({
  ...jest.requireActual('../../contexts/NotificationContext'),
  useNotification: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    showInfo: mockShowInfo
  })
}));

// Mock battle state
const mockBattleState = {
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
  },
  rewards: {
    xp_earned: 100,
    coins_earned: 50,
    streak_bonus: 0,
    time_bonus: 0,
    total_xp: 100,
    total_coins: 50
  }
};

// Mock game state
const mockGameState = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@test.com',
    streak: 0,
    level: 1,
    xp: 0,
    coins: 0
  },
  battle: mockBattleState,
  battle_stats: {
    total_battles: 0,
    wins: 0,
    losses: 0,
    win_streak: 0,
    highest_streak: 0,
    total_xp_earned: 0,
    total_coins_earned: 0,
    difficulty: 'medium' as const
  },
  loading: false,
  initialized: true
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
    case 'SET_LOADING':
      mockGameState.loading = action.payload;
      break;
    case 'UPDATE_USER_PROFILE':
      mockGameState.user = action.payload;
      break;
    case 'UPDATE_BATTLE_STATUS':
      mockGameState.battle = {
        ...mockGameState.battle,
        ...action.payload
      };
      break;
  }
});

// Mock game context
jest.mock('../../contexts/GameContext', () => {
  const actual = jest.requireActual('../../contexts/GameContext');
  return {
    ...actual,
    useGame: () => ({
      state: mockGameState,
      dispatch: mockDispatch,
      user: mockGameState.user,
      isLoading: false,
      initialized: true,
      getCurrentQuestion: () => mockQuestion,
      getBattleStatus: () => mockBattleState.status,
      getBattleProgress: () => ({
        currentQuestion: mockBattleState.current_question,
        totalQuestions: mockBattleState.total_questions,
        timeLeft: mockBattleState.time_left,
        score: mockBattleState.score
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
  };
});

// Mock auth context
jest.mock('../../contexts/AuthContext', () => {
  const actual = jest.requireActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => mockAuthState
  };
});

// Mock notification context
jest.mock('../../contexts/NotificationContext', () => {
  const actual = jest.requireActual('../../contexts/NotificationContext');
  return {
    ...actual,
    useNotification: () => ({
      showSuccess: mockShowSuccess,
      showError: mockShowError,
      showInfo: mockShowInfo,
      showBattleNotification: jest.fn()
    })
  };
});

// Mock sound context
jest.mock('../../contexts/SoundContext', () => {
  const actual = jest.requireActual('../../contexts/SoundContext');
  return {
    ...actual,
    useSoundContext: () => ({
      play_sound: jest.fn(),
      stop_sound: jest.fn(),
      is_muted: false,
      toggle_mute: jest.fn()
    })
  };
});

// Mock language context
jest.mock('../../contexts/LanguageContext', () => {
  const actual = jest.requireActual('../../contexts/LanguageContext');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'en' }
    })
  };
});

// Mock battle service
jest.mock('../../services/battleService', () => ({
  BattleService: {
    getCurrentGameState: jest.fn(() => Promise.resolve({
      user: mockGameState.user,
      battle_stats: mockGameState.battle_stats
    })),
    fetch_battle_questions: jest.fn(() => Promise.resolve([mockQuestion])),
    get_opponent: jest.fn(() => Promise.resolve({
      id: 'bot',
      name: 'Bot Opponent',
      avatar: '/bot-avatar.png',
      is_bot: true,
      rating: 1000,
      level: 1
    })),
    update_battle_stats: jest.fn(() => Promise.resolve())
  }
}));

// Mock level system
jest.mock('../../lib/levelSystem', () => ({
  LevelSystem: {
    calculate_complete_battle_rewards: jest.fn(() => ({
      xp_earned: 100,
      coins_earned: 50,
      streak_bonus: 0,
      time_bonus: 0,
      total_xp: 100,
      total_coins: 50
    }))
  }
}));

// Mock achievements
jest.mock('../../hooks/useAchievements', () => ({
  useAchievements: () => ({
    check_achievements: jest.fn(() => Promise.resolve())
  })
}));

// Mock battle sound
jest.mock('../../hooks/useBattleSound', () => ({
  useBattleSound: () => ({
    play_sound: jest.fn(),
    stop_sound: jest.fn(),
    is_muted: false,
    toggle_mute: jest.fn()
  })
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const { AuthProvider } = jest.requireActual('../../contexts/AuthContext');
  const { GameProvider } = jest.requireActual('../../contexts/GameContext');
  const { NotificationProvider } = jest.requireActual('../../contexts/NotificationContext');
  const { SoundProvider } = jest.requireActual('../../contexts/SoundContext');
  const { LanguageProvider } = jest.requireActual('../../contexts/LanguageContext');

  return (
    <AuthProvider>
      <GameProvider initialState={mockGameState}>
        <NotificationProvider>
          <SoundProvider>
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </SoundProvider>
        </NotificationProvider>
      </GameProvider>
    </AuthProvider>
  );
};

describe('useBattle Hook', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Reset game state
    mockGameState.battle = { ...mockBattleState };

    // Reset mock functions
    mockDispatch.mockImplementation((action) => {
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
        case 'SET_LOADING':
          mockGameState.loading = action.payload;
          break;
        case 'UPDATE_USER_PROFILE':
          mockGameState.user = action.payload;
          break;
        case 'UPDATE_BATTLE_STATUS':
          mockGameState.battle = {
            ...mockGameState.battle,
            ...action.payload
          };
          break;
      }
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes battle state correctly', async () => {
    const { result } = renderHook(() => useBattle(), { wrapper: Wrapper });

    // Wait for the hook to be ready
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

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

  it('initializes battle with correct options', async () => {
    const { result } = renderHook(() => useBattle(), { wrapper: Wrapper });

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await result.current.initializeBattle({ difficulty: 'hard' });
    });

    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'INITIALIZE_BATTLE',
      payload: expect.objectContaining({
        questions: [mockQuestion],
        opponent: expect.objectContaining({
          is_bot: true
        })
      })
    }));
  });

  it('handles answer submission correctly', async () => {
    const { result } = renderHook(() => useBattle(), { wrapper: Wrapper });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // Set up initial state for answer submission
    mockGameState.battle.phase = BattlePhase.QUESTION;
    mockGameState.battle.current_question = 0;

    await act(async () => {
      await result.current.handleAnswer('A', mockPlayerCard.id, mockOpponentCard.id, mockPlayerHand, mockOpponentHand);
    });

    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'ANSWER_QUESTION',
      payload: expect.objectContaining({
        answer: 'A'
      })
    }));
  });

  it('handles resolution completion correctly', async () => {
    const { result } = renderHook(() => useBattle(), { wrapper: Wrapper });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // Set up initial state for resolution
    mockGameState.battle.phase = BattlePhase.RESOLUTION;

    await act(async () => {
      await result.current.handleResolutionComplete({
        victory: true,
        draw: false,
        user_id: 'test-user-id',
        score: { player: 1, opponent: 0 },
        rewards: {
          xp_earned: 100,
          coins_earned: 50,
          streak_bonus: 0
        },
        stats: {
          time_taken: 15,
          total_questions: 1,
          average_time: 15,
          correct_answers: 1
        }
      });
    });

    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'SET_BATTLE_PHASE',
      payload: BattlePhase.CARD_SELECTION
    }));
  });

  it('updates phase correctly', async () => {
    const { result } = renderHook(() => useBattle(), { wrapper: Wrapper });

    await act(async () => {
      jest.advanceTimersByTime(1000);
      result.current.setPhase(BattlePhase.CARD_SELECTION);
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_BATTLE_PHASE',
      payload: BattlePhase.CARD_SELECTION
    });
  });

  it('calculates rewards correctly', async () => {
    const { result } = renderHook(() => useBattle(), { wrapper: Wrapper });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

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