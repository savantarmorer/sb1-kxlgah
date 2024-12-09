import { renderHook, act } from '@testing-library/react-hooks';
import { TournamentProvider, useTournament } from '../../contexts/TournamentContext';
import { TEST_MOCKS } from '../../types/tournament.TODO';

describe('TournamentContext Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should manage tournament state correctly', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TournamentProvider>{children}</TournamentProvider>
    );

    const { result, waitForNextUpdate } = renderHook(() => useTournament(), { wrapper });

    // 1. Estado inicial
    expect(result.current.state.isLoading).toBe(true);
    expect(result.current.state.activeTournament).toBeNull();

    // 2. Carregar torneio
    await act(async () => {
      await result.current.registerForTournament('test-tournament');
    });

    await waitForNextUpdate();

    expect(result.current.state.activeTournament).toBeDefined();
    expect(result.current.state.isLoading).toBe(false);

    // 3. Iniciar partida
    await act(async () => {
      await result.current.startMatch('test-match');
    });

    expect(result.current.state.currentMatch).toBeDefined();

    // 4. Submeter resultado
    await act(async () => {
      await result.current.submitMatchResult('test-match', 100);
    });

    expect(result.current.state.currentMatch).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TournamentProvider>{children}</TournamentProvider>
    );

    const { result } = renderHook(() => useTournament(), { wrapper });

    // Simular erro na API
    TEST_MOCKS.simulateAPIError();

    await act(async () => {
      await result.current.registerForTournament('invalid-tournament');
    });

    expect(result.current.state.error).toBeDefined();
  });
}); 