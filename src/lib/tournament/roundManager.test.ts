
describe('TournamentRoundManager', () => {
  describe('calculateTotalRounds', () => {
    it('should calculate correct number of rounds', () => {
      expect(TournamentRoundManager.calculateTotalRounds(8)).toBe(3);
      expect(TournamentRoundManager.calculateTotalRounds(16)).toBe(4);
      expect(TournamentRoundManager.calculateTotalRounds(4)).toBe(2);
    });
  });

  describe('generateInitialPairings', () => {
    const mockParticipants = [
      { user_id: '1', name: 'Player 1' },
      { user_id: '2', name: 'Player 2' },
      { user_id: '3', name: 'Player 3' },
      { user_id: '4', name: 'Player 4' }
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
    it('should generate pairings for winners', () => {
      const winners = ['1', '2', '3', '4'];
      const pairings = TournamentRoundManager.generateNextRoundPairings(winners, 1);
      
      expect(pairings.length).toBe(2);
      expect(pairings[0].round).toBe(2);
    });
  });

  describe('validateRoundStart', () => {
    it('should validate round timing correctly', () => {
      const tournament = {
        start_date: new Date().toISOString(),
        // ... outros campos necessários
      };

      expect(TournamentRoundManager.validateRoundStart(tournament, 1)).toBe(true);
      
      // Round futuro não deve estar disponível ainda
      expect(TournamentRoundManager.validateRoundStart(tournament, 3)).toBe(false);
    });
  });
});