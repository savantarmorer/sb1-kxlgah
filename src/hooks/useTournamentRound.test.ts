import { renderHook, act } from '@testing-library/react-hooks';
import { useTournamentRound } from './useTournamentRound';

// Mock do Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          data: [
            { status: 'completed' },
            { status: 'completed' }
          ]
        })
      })
    })
  })
}));

describe('useTournamentRound', () => {
  it('should load round status', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useTournamentRound('test-tournament-id')
    );

    await waitForNextUpdate();

    expect(result.current.roundStatus).toBeDefined();
    expect(result.current.currentRound).toBe(1);
  });

  it('should advance round when complete', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useTournamentRound('test-tournament-id')
    );

    await waitForNextUpdate();

    expect(result.current.canAdvance).toBe(true);
    
    // Simula avanço de round
    act(() => {
      result.current.roundStatus?.isComplete;
    });

    expect(result.current.currentRound).toBe(2);
  });

  it('should handle loading state', () => {
    const { result } = renderHook(() => 
      useTournamentRound('test-tournament-id')
    );

    expect(result.current.isLoading).toBe(true);
  });
}); 