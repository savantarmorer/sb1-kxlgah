import { calculateAnswerScore, calculateTournamentRewards } from './tournamentScoring';

describe('TournamentScoring', () => {
  describe('calculateAnswerScore', () => {
    it('should calculate base score correctly', () => {
      const score = calculateAnswerScore({
        timeRemaining: 300,
        streak: 1,
        difficulty: 'medium',
        isCorrect: true
      });

      expect(score.total).toBe(150);
      expect(score.baseScore).toBe(100);
      expect(score.timeBonus).toBe(50);
    });

    it('should apply time bonus', () => {
      const maxTimeScore = calculateAnswerScore({
        timeRemaining: 300,
        streak: 1,
        difficulty: 'medium',
        isCorrect: true
      });

      const lowTimeScore = calculateAnswerScore({
        timeRemaining: 50,
        streak: 1,
        difficulty: 'medium',
        isCorrect: true
      });

      expect(maxTimeScore.timeBonus).toBeGreaterThan(lowTimeScore.timeBonus);
    });

    it('should apply streak multiplier', () => {
      const highStreakScore = calculateAnswerScore({
        timeRemaining: 300,
        streak: 5,
        difficulty: 'medium',
        isCorrect: true
      });

      const lowStreakScore = calculateAnswerScore({
        timeRemaining: 300,
        streak: 1,
        difficulty: 'medium',
        isCorrect: true
      });

      expect(highStreakScore.total).toBeGreaterThan(lowStreakScore.total);
    });
  });

  describe('calculateTournamentRewards', () => {
    it('should calculate rewards based on position', () => {
      const firstPlace = calculateTournamentRewards({
        position: 1,
        totalParticipants: 8,
        difficulty: 'medium'
      });

      const secondPlace = calculateTournamentRewards({
        position: 2,
        totalParticipants: 8,
        difficulty: 'medium'
      });

      expect(firstPlace.xp).toBeGreaterThan(secondPlace.xp);
      expect(firstPlace.coins).toBeGreaterThan(secondPlace.coins);
    });

    it('should include special items for top positions', () => {
      const firstPlace = calculateTournamentRewards({
        position: 1,
        totalParticipants: 8,
        difficulty: 'hard'
      });

      const lastPlace = calculateTournamentRewards({
        position: 8,
        totalParticipants: 8,
        difficulty: 'hard'
      });

      expect(firstPlace.specialItems.length).toBeGreaterThan(0);
      expect(lastPlace.specialItems.length).toBe(0);
    });
  });
}); 