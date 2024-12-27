import { TournamentRoundManager } from './roundManager';
import { vi } from 'vitest';

const mockParticipants = [
  { id: 'p1', name: 'Player 1' },
  { id: 'p2', name: 'Player 2' },
  { id: 'p3', name: 'Player 3' },
  { id: 'p4', name: 'Player 4' }
];

const mockWinners = [
  { id: 'p1', name: 'Player 1', score: 100 },
  { id: 'p2', name: 'Player 2', score: 90 }
];

const mockTournament = {
  id: 'tournament-1',
  name: 'Test Tournament',
  status: 'active',
  current_round: 1,
  start_time: new Date().toISOString(),
  end_time: new Date(Date.now() + 3600000).toISOString(),
  participants: mockParticipants,
  round_duration: 300
};

describe('TournamentRoundManager', () => {
  it('calculateTotalRounds should handle different participant counts', () => {
    expect(TournamentRoundManager.calculateTotalRounds(4)).toBe(2);
    expect(TournamentRoundManager.calculateTotalRounds(8)).toBe(3);
    expect(TournamentRoundManager.calculateTotalRounds(16)).toBe(4);
  });

  describe('generateInitialPairings', () => {
    it('should generate correct number of pairings', () => {
      const pairings = TournamentRoundManager.generateInitialPairings(mockParticipants);
      expect(pairings.length).toBe(2);
    });

    it('should assign players to different pairs', () => {
      const pairings = TournamentRoundManager.generateInitialPairings(mockParticipants);
      const allPlayers = pairings.flatMap(p => [p.player1_id, p.player2_id]);
      const uniquePlayers = new Set(allPlayers);
      expect(uniquePlayers.size).toBe(4);
    });
  });

  describe('generateNextRoundPairings', () => {
    it('should generate pairings for winners', () => {
      const pairings = TournamentRoundManager.generateNextRoundPairings(mockWinners, 2);
      expect(pairings.length).toBe(1);
      expect(pairings[0].round).toBe(2);
      expect(pairings[0].player1_id).toBe('p1');
      expect(pairings[0].player2_id).toBe('p2');
    });
  });

  describe('validateRoundStart', () => {
    it('should validate round timing correctly', () => {
      const validTournament = {
        ...mockTournament,
        current_round: 1,
        start_time: new Date().toISOString()
      };

      expect(TournamentRoundManager.validateRoundStart(validTournament, 1)).toBe(true);
      expect(TournamentRoundManager.validateRoundStart(validTournament, 2)).toBe(false);
      expect(TournamentRoundManager.validateRoundStart({ ...validTournament, status: 'complete' }, 1)).toBe(false);
    });
  });
});