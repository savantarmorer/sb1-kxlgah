import { TournamentRoundManager } from './roundManager';
import { vi } from 'vitest';

const mockParticipants = [
  { id: 'p1', name: 'Player 1', rating: 1500 },
  { id: 'p2', name: 'Player 2', rating: 1600 },
  { id: 'p3', name: 'Player 3', rating: 1400 },
  { id: 'p4', name: 'Player 4', rating: 1550 }
];

const mockWinners = [
  { player_id: 'p1', score: 100 },
  { player_id: 'p2', score: 90 }
];

const mockTournament = {
  id: 'tournament-1',
  name: 'Test Tournament',
  status: 'active',
  current_round: 1,
  start_time: new Date().toISOString(),
  end_time: new Date(Date.now() + 3600000).toISOString(),
  participants: mockParticipants,
  round_duration: 300,
  total_rounds: 2
};

describe('TournamentRoundManager', () => {
  describe('calculateTotalRounds', () => {
    it('calculates correct number of rounds', () => {
      expect(TournamentRoundManager.calculateTotalRounds(8)).toBe(3);
      expect(TournamentRoundManager.calculateTotalRounds(16)).toBe(4);
      expect(TournamentRoundManager.calculateTotalRounds(4)).toBe(2);
    });
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
      expect(uniquePlayers.size).toBe(mockParticipants.length);
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
      const mockTournamentWithTime = {
        ...mockTournament,
        current_round: 1,
        start_time: new Date(Date.now() - 1000).toISOString(),
        end_time: new Date(Date.now() + 86400000).toISOString()
      };

      expect(TournamentRoundManager.validateRoundStart(mockTournamentWithTime, 1)).toBe(true);
      expect(TournamentRoundManager.validateRoundStart(mockTournamentWithTime, 2)).toBe(false);
      expect(TournamentRoundManager.validateRoundStart({ ...mockTournamentWithTime, status: 'completed' }, 1)).toBe(false);
    });
  });
});