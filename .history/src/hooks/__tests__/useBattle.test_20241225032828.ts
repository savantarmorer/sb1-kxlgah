import { renderHook, act } from '@testing-library/react-hooks';
import { GameProvider } from '../../contexts/GameContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { useBattle } from '../useBattle';
import { BattlePhase } from '../../types/battle';

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

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <NotificationProvider>
    <GameProvider>
      {children}
    </GameProvider>
  </NotificationProvider>
);

describe('useBattle Hook', () => {
  it('initializes battle state correctly', () => {
    const { result } = renderHook(() => useBattle(), { wrapper: Wrapper });

    expect(result.current.phase).toBe(BattlePhase.PREPARING);
    expect(result.current.playerState.health).toBe(50);
    expect(result.current.opponentState.health).toBe(50);
  });

  it('handles answer submission correctly', async () => {
    const { result } = renderHook(() => useBattle(), { wrapper: Wrapper });

    await act(async () => {
      result.current.handleAnswer('A', mockPlayerCard.id, mockOpponentCard.id, mockPlayerHand, mockOpponentHand);
    });

    expect(result.current.phase).toBe(BattlePhase.RESOLUTION);
  });

  it('handles resolution completion correctly', () => {
    const { result } = renderHook(() => useBattle(), { wrapper: Wrapper });

    act(() => {
      result.current.handleResolutionComplete();
    });

    expect(result.current.phase).toBe(BattlePhase.CARD_SELECTION);
  });

  it('initializes battle with correct mode', async () => {
    const { result } = renderHook(() => useBattle(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.initializeBattle('constitutional');
    });

    expect(result.current.phase).toBe(BattlePhase.DEALING);
  });
}); 