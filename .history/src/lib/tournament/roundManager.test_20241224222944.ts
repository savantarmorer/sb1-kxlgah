import { TournamentRoundManager } from './roundManager';

describe('TournamentRoundManager', () => {
  const mockParticipants = ['1', '2', '3', '4'];

  describe('calculateTotalRounds', () => {
    it('should calculate correct number of rounds', () => {
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
      const winners = ['1', '2', '3', '4'];
      const pairings = TournamentRoundManager.generateNextRoundPairings(winners, 1);

      expect(pairings.length).toBe(2);
      expect(pairings[0].round).toBe(1);
      expect(pairings[1].round).toBe(1);
    });
  });

  describe('validateRoundStart', () => {
    it('should validate round timing correctly', () => {
      const tournament = {
        start_time: new Date().toISOString(),
        round_duration: 30,
        current_round: 1
      };

      expect(TournamentRoundManager.validateRoundStart(tournament, 1)).toBe(true);

      // Future round should not be available yet
      expect(TournamentRoundManager.validateRoundStart(tournament, 2)).toBe(false);

      // Past round should not be available
      tournament.current_round = 2;
      expect(TournamentRoundManager.validateRoundStart(tournament, 1)).toBe(false);
    });
  });
});