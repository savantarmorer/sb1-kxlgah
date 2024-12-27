import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/testUtils';
import { TournamentList } from '../../components/Tournament/TournamentList';
import { TournamentBracket } from '../../components/Tournament/TournamentBracket';
import { MatchView } from '../../components/Tournament/MatchView';
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

// Mock match data
const mockMatch = {
  id: 'match-1',
  status: 'active',
  player1_id: 'test-user',
  player2_id: 'opponent-id',
  current_question: {
    id: 'q1',
    text: 'Test question',
    options: ['A', 'B', 'C', 'D'],
    correct_answer: 0
  }
};

// Mock services
const mockTournamentService = {
  fetchTournaments: vi.fn().mockResolvedValue([mockTournament]),
  joinTournament: vi.fn().mockResolvedValue({ success: true }),
  fetchTournament: vi.fn().mockResolvedValue(mockTournament),
};

const mockMatchService = {
  fetchMatch: vi.fn().mockResolvedValue(mockMatch),
  submitAnswer: vi.fn().mockResolvedValue({ correct: true, score: 100 }),
};

vi.mock('@/services/TournamentService', () => ({
  default: mockTournamentService
}));

vi.mock('@/services/MatchService', () => ({
  default: mockMatchService
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
      expect(mockTournamentService.joinTournament).toHaveBeenCalledWith(mockTournament.id);
      expect(screen.getByText(/tournament joined/i)).toBeInTheDocument();
    });
  });

  it('should handle match progression correctly', async () => {
    renderWithProviders(<MatchView matchId="match-1" />);

    // Wait for match to load
    await waitFor(() => {
      expect(mockMatchService.fetchMatch).toHaveBeenCalledWith('match-1');
      expect(screen.getByTestId('match-view')).toBeInTheDocument();
    });

    // Answer questions
    const answerButton = screen.getByTestId('answer-0');
    fireEvent.click(answerButton);

    await waitFor(() => {
      expect(mockMatchService.submitAnswer).toHaveBeenCalledWith('match-1', 0);
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });
  });

  it('should handle tournament completion', async () => {
    mockTournamentService.fetchTournament.mockResolvedValueOnce({
      ...mockTournament,
      status: 'completed',
      standings: [
        { player_id: 'test-user', position: 1 },
        { player_id: 'opponent-id', position: 2 }
      ]
    });

    renderWithProviders(<TournamentBracket tournamentId={mockTournament.id} />);

    // Wait for bracket to load
    await waitFor(() => {
      expect(mockTournamentService.fetchTournament).toHaveBeenCalledWith(mockTournament.id);
      expect(screen.getByTestId('tournament-bracket')).toBeInTheDocument();
    });

    // Verify final standings
    expect(screen.getByText(/final standings/i)).toBeInTheDocument();
  });
}); 