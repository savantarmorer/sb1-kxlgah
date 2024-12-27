import { renderHook, act } from '@testing-library/react-hooks';
import { useBattle } from '../useBattle';
import { GameProvider } from '../../contexts/GameContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { BattleQuestion, Card, PlayerState } from '../../types/battle';

// Mock data
const mockQuestion: BattleQuestion = {
  id: '1',
  question: 'Test question?',
  alternatives: {
    A: 'Test A',
    B: 'Test B',
    C: 'Test C',
    D: 'Test D'
  },
  correct_answer: 'A',
  difficulty: 'medium',
  category: 'test'
};

const mockPlayerCard: Card = {
  id: '1',
  action: 'attack',
  power: 10,
  effect: null
};

const mockOpponentCard: Card = {
  id: '2',
  action: 'defense',
  power: 8,
  effect: null
};

const mockInitialPlayerState: PlayerState = {
  health: 50,
  shield: 0,
  isReady: false
};

describe('useBattle Hook', () => {
  it('initializes battle with correct state', async () => {
    const { result } = renderHook(() => useBattle(), {
      wrapper: ({ children }) => (
        <NotificationProvider>
          <GameProvider>
            {children}
          </GameProvider>
        </NotificationProvider>
      )
    });

    await act(async () => {
      await result.current.initializeBattle();
    });

    expect(result.current.state.battle).toBeDefined();
    expect(result.current.state.battle?.status).toBe('preparing');
  });

  it('handles answer submission correctly', async () => {
    const { result } = renderHook(() => useBattle(), {
      wrapper: ({ children }) => (
        <NotificationProvider>
          <GameProvider>
            {children}
          </GameProvider>
        </NotificationProvider>
      )
    });

    await act(async () => {
      await result.current.answer_question('A');
    });

    expect(result.current.state.battle?.player_answers).toContain(true);
  });

  it('calculates damage correctly', async () => {
    const { result } = renderHook(() => useBattle(), {
      wrapper: ({ children }) => (
        <NotificationProvider>
          <GameProvider>
            {children}
          </GameProvider>
        </NotificationProvider>
      )
    });

    const damage = result.current.calculateDamage('attack', 'defense', 30, true);
    expect(damage).toBe(0); // Defense blocks attack
  });

  it('handles battle completion correctly', async () => {
    const { result } = renderHook(() => useBattle(), {
      wrapper: ({ children }) => (
        <NotificationProvider>
          <GameProvider>
            {children}
          </GameProvider>
        </NotificationProvider>
      )
    });

    await act(async () => {
      await result.current.handle_battle_completion({
        victory: true,
        draw: false,
        user_id: '1',
        score: { player: 10, opponent: 5 },
        rewards: {
          xp_earned: 100,
          coins_earned: 50,
          streak_bonus: 10,
          time_bonus: 20
        },
        stats: {
          time_taken: 25,
          total_questions: 10,
          average_time: 25,
          correct_answers: 8
        }
      });
    });

    expect(result.current.state.battle?.status).toBe('completed');
    expect(result.current.state.battle?.rewards).toBeDefined();
  });

  it('handles card selection correctly', async () => {
    const { result } = renderHook(() => useBattle(), {
      wrapper: ({ children }) => (
        <NotificationProvider>
          <GameProvider>
            {children}
          </GameProvider>
        </NotificationProvider>
      )
    });

    await act(async () => {
      await result.current.handleCardSelect(mockPlayerCard.id);
    });

    expect(result.current.state.battle?.selected_card).toBe(mockPlayerCard.id);
  });

  it('handles resolution phase correctly', async () => {
    const { result } = renderHook(() => useBattle(), {
      wrapper: ({ children }) => (
        <NotificationProvider>
          <GameProvider>
            {children}
          </GameProvider>
        </NotificationProvider>
      )
    });

    await act(async () => {
      await result.current.handleResolutionComplete();
    });

    expect(result.current.state.battle?.phase).toBe('card_selection');
    expect(result.current.state.battle?.selected_card).toBeUndefined();
  });
}); 