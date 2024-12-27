import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockTournament, mockUser } from '../../test/testUtils';
import { TournamentList } from '../../components/Tournament/TournamentList';
import { TournamentBracket } from '../../components/Tournament/TournamentBracket';
import { MatchView } from '../../components/Tournament/MatchView';
import { vi } from 'vitest';

// Mock services
vi.mock('@/services/TournamentService', () => ({
  default: {
    fetchTournaments: vi.fn().mockResolvedValue([mockTournament]),
    joinTournament: vi.fn().mockResolvedValue({ success: true }),
    fetchTournament: vi.fn().mockResolvedValue(mockTournament),
  }
}));

vi.mock('@/services/MatchService', () => ({
  default: {
    fetchMatch: vi.fn().mockResolvedValue({
      id: 'match-1',
      status: 'active',
      player1_id: mockUser.id,
      player2_id: 'opponent-id',
    }),
    submitAnswer: vi.fn().mockResolvedValue({ correct: true, score: 100 }),
  }
}));

describe('Tournament Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle complete tournament flow', async () => {
    renderWithProviders(<TournamentList />);

    // Wait for tournaments to load
    await waitFor(() => {
      expect(screen.getByText(mockTournament.name)).toBeInTheDocument();
    });

    // Join tournament
    const joinButton = screen.getByRole('button', { name: /join/i });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText(/tournament joined/i)).toBeInTheDocument();
    });
  });

  it('should handle match progression correctly', async () => {
    renderWithProviders(<MatchView matchId="match-1" />);

    // Wait for match to load
    await waitFor(() => {
      expect(screen.getByTestId('match-view')).toBeInTheDocument();
    });

    // Answer questions
    const answerButton = screen.getByTestId('answer-0');
    fireEvent.click(answerButton);

    await waitFor(() => {
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });
  });

  it('should handle tournament completion', async () => {
    renderWithProviders(<TournamentBracket tournamentId={mockTournament.id} />);

    // Wait for bracket to load
    await waitFor(() => {
      expect(screen.getByTestId('tournament-bracket')).toBeInTheDocument();
    });

    // Verify final standings
    expect(screen.getByText(/final standings/i)).toBeInTheDocument();
  });
}); 