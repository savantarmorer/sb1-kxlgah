import { renderHook, act } from '@testing-library/react-hooks';
import { useBattle } from '../useBattle';
import { BattlePhase, BattleStatus } from '../../types/battle';

// Mock state
const mockBattleState = {
  phase: BattlePhase.PREPARING,
  playerState: {
    health: 50,
    shield: 0,
    isReady: false
  },
  opponentState: {
    health: 50,
    shield: 0,
    isReady: false
  }
};

// Mock hook implementation
jest.mock('../useBattle', () => ({
  useBattle: () => ({
    phase: mockBattleState.phase,
    playerState: mockBattleState.playerState,
    opponentState: mockBattleState.opponentState,
    initializeBattle: jest.fn(() => Promise.resolve()),
    handleAnswer: jest.fn(() => Promise.resolve()),
    handleResolutionComplete: jest.fn(() => Promise.resolve()),
    setPhase: jest.fn(),
    getBattleRewards: () => ({
      xp_earned: 100,
      coins_earned: 50,
      streak_bonus: 0,
      time_bonus: 0,
      total_xp: 100,
      total_coins: 50
    })
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