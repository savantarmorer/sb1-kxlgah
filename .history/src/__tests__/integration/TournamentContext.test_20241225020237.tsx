import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useTournament } from '../../contexts/TournamentContext';
import { renderWithProviders } from '../../test/testUtils';
import { vi } from 'vitest';

// Mock tournament data
const mockTournament = {
  id: 'test-tournament',
  name: 'Test Tournament',
  status: 'active',
  current_round: 1,
  total_rounds: 3,
  start_time: new Date().toISOString(),
  end_time: new Date(Date.now() + 86400000).toISOString(),
  participants: []
};

// Mock tournament service
const mockTournamentService = {
  fetchTournament: vi.fn().mockResolvedValue(mockTournament),
  joinTournament: vi.fn().mockResolvedValue({ success: true }),
  leaveTournament: vi.fn().mockResolvedValue({ success: true }),
};

vi.mock('@/services/TournamentService', () => ({
  default: mockTournamentService
}));

describe('TournamentContext Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should manage tournament state correctly', async () => {
    const { result } = renderHook(() => useTournament(), {
      wrapper: ({ children }) => renderWithProviders(<>{children}</>)
    });

    // Initial state
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.activeTournament).toBeNull();

    // Join tournament
    await act(async () => {
      await result.current.joinTournament(mockTournament.id);
    });

    expect(mockTournamentService.joinTournament).toHaveBeenCalledWith(mockTournament.id);
    expect(result.current.state.activeTournament).toEqual(mockTournament);
    expect(result.current.state.isLoading).toBe(false);

    // Leave tournament
    await act(async () => {
      await result.current.leaveTournament();
    });

    expect(mockTournamentService.leaveTournament).toHaveBeenCalled();
    expect(result.current.state.activeTournament).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    mockTournamentService.joinTournament.mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useTournament(), {
      wrapper: ({ children }) => renderWithProviders(<>{children}</>)
    });

    await act(async () => {
      await result.current.joinTournament('invalid-id');
    });

    expect(result.current.state.error).toBeTruthy();
    expect(result.current.state.isLoading).toBe(false);
  });
}); 