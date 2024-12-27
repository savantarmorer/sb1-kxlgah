import { TournamentRoundManager } from './roundManager';

describe('TournamentRoundManager', () => {
  describe('calculateTotalRounds', () => {
    it('calculates correct number of rounds', () => {
      expect(TournamentRoundManager.calculateTotalRounds(8)).toBe(3);
      expect(TournamentRoundManager.calculateTotalRounds(16)).toBe(4);
      expect(TournamentRoundManager.calculateTotalRounds(4)).toBe(2);
    });
  });

  describe('generateInitialPairings', () => {
    const mockParticipants = [
      { id: 'p1', rating: 1500 },
      { id: 'p2', rating: 1600 },
      { id: 'p3', rating: 1400 },
      { id: 'p4', rating: 1550 }
    ];

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
    const mockWinners = [
      { player_id: 'p1', score: 100 },
      { player_id: 'p2', score: 90 },
      { player_id: 'p3', score: 80 },
      { player_id: 'p4', score: 70 }
    ];

    it('should generate pairings for winners', () => {
      const pairings = TournamentRoundManager.generateNextRoundPairings(mockWinners, 2);
      expect(pairings.length).toBe(2);
      expect(pairings[0].round).toBe(2);
      expect(pairings[1].round).toBe(2);
    });
  });

  describe('validateRoundStart', () => {
    const mockTournament = {
      id: 'tournament1',
      status: 'active',
      current_round: 1,
      start_time: new Date(Date.now() - 1000).toISOString(),
      end_time: new Date(Date.now() + 86400000).toISOString()
    };

    it('should validate round timing correctly', () => {
      expect(TournamentRoundManager.validateRoundStart(mockTournament, 1)).toBe(true);
      expect(TournamentRoundManager.validateRoundStart(mockTournament, 2)).toBe(false);
      expect(TournamentRoundManager.validateRoundStart({ ...mockTournament, status: 'completed' }, 1)).toBe(false);
    });
  });
});