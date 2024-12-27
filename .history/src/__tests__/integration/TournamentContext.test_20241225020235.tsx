import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useTournament } from '../../contexts/TournamentContext';
import { renderWithProviders, mockTournament, mockFunctions } from '../../test/testUtils';
import { vi } from 'vitest';

vi.mock('@/services/TournamentService', () => ({
  default: {
    fetchTournament: vi.fn().mockResolvedValue(mockTournament),
    joinTournament: vi.fn().mockResolvedValue({ success: true }),
    leaveTournament: vi.fn().mockResolvedValue({ success: true }),
  }
}));

describe('TournamentContext Integration', () => {
  beforeEach(() => {
    mockFunctions.clearMocks();
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

    expect(result.current.state.activeTournament).toEqual(mockTournament);
    expect(result.current.state.isLoading).toBe(false);

    // Leave tournament
    await act(async () => {
      await result.current.leaveTournament();
    });

    expect(result.current.state.activeTournament).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    mockFunctions.simulateAPIError();

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