import { TournamentScoring } from './tournamentScoring';

describe('TournamentScoring', () => {
  describe('calculateAnswerScore', () => {
    it('should calculate base score correctly', () => {
      const score = TournamentScoring.calculateAnswerScore({
        timeRemaining: 300,
        streak: 1,
        round: 1,
        difficulty: 1
      });

      expect(score).toBe(100);
    });

    it('should apply time bonus', () => {
      const score = TournamentScoring.calculateAnswerScore({
        timeRemaining: 300, // Tempo máximo
        streak: 1,
        round: 1,
        difficulty: 1
      });

      const scoreLessTime = TournamentScoring.calculateAnswerScore({
        timeRemaining: 150, // Metade do tempo
        streak: 1,
        round: 1,
        difficulty: 1
      });

      expect(score).toBeGreaterThan(scoreLessTime);
    });

    it('should apply streak multiplier', () => {
      const baseScore = TournamentScoring.calculateAnswerScore({
        timeRemaining: 300,
        streak: 1,
        round: 1,
        difficulty: 1
      });

      const streakScore = TournamentScoring.calculateAnswerScore({
        timeRemaining: 300,
        streak: 3,
        round: 1,
        difficulty: 1
      });

      expect(streakScore).toBeGreaterThan(baseScore);
    });
  });

  describe('calculateTournamentRewards', () => {
    it('should calculate rewards based on position', () => {
      const firstPlace = TournamentScoring.calculateTournamentRewards({
        position: 1,
        totalParticipants: 8,
        tournamentTier: 1,
        playerPerformance: 100
      });

      const lastPlace = TournamentScoring.calculateTournamentRewards({
        position: 8,
        totalParticipants: 8,
        tournamentTier: 1,
        playerPerformance: 100
      });

      expect(firstPlace.xp).toBeGreaterThan(lastPlace.xp);
      expect(firstPlace.coins).toBeGreaterThan(lastPlace.coins);
    });

    it('should include special items for top positions', () => {
      const firstPlace = TournamentScoring.calculateTournamentRewards({
        position: 1,
        totalParticipants: 8,
        tournamentTier: 1,
        playerPerformance: 100
      });

      expect(firstPlace.special_items).toBeDefined();
      expect(firstPlace.special_items?.length).toBeGreaterThan(0);
    });
  });
}); 