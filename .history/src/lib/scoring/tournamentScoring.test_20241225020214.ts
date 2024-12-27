import { calculateAnswerScore, calculateTournamentRewards } from './tournamentScoring';
import { vi } from 'vitest';

describe('TournamentScoring', () => {
  describe('calculateAnswerScore', () => {
    it('should calculate base score correctly', () => {
      const score = calculateAnswerScore({
        timeRemaining: 300,
        streak: 1,
        difficulty: 'normal',
        isCorrect: true
      });

      expect(score).toBe(100);
    });

    it('should apply time bonus', () => {
      const maxTimeScore = calculateAnswerScore({
        timeRemaining: 300,
        streak: 1,
        difficulty: 'normal',
        isCorrect: true
      });

      const minTimeScore = calculateAnswerScore({
        timeRemaining: 10,
        streak: 1,
        difficulty: 'normal',
        isCorrect: true
      });

      expect(maxTimeScore).toBeGreaterThan(minTimeScore);
    });

    it('should apply streak multiplier', () => {
      const highStreakScore = calculateAnswerScore({
        timeRemaining: 300,
        streak: 5,
        difficulty: 'normal',
        isCorrect: true
      });

      const lowStreakScore = calculateAnswerScore({
        timeRemaining: 300,
        streak: 1,
        difficulty: 'normal',
        isCorrect: true
      });

      expect(highStreakScore).toBeGreaterThan(lowStreakScore);
    });
  });

  describe('calculateTournamentRewards', () => {
    it('should calculate rewards based on position', () => {
      const firstPlace = calculateTournamentRewards({
        position: 1,
        totalParticipants: 8,
        baseReward: 100
      });

      const secondPlace = calculateTournamentRewards({
        position: 2,
        totalParticipants: 8,
        baseReward: 100
      });

      expect(firstPlace.xp).toBeGreaterThan(secondPlace.xp);
      expect(firstPlace.coins).toBeGreaterThan(secondPlace.coins);
    });

    it('should include special items for top positions', () => {
      const firstPlace = calculateTournamentRewards({
        position: 1,
        totalParticipants: 8,
        baseReward: 100
      });

      const lastPlace = calculateTournamentRewards({
        position: 8,
        totalParticipants: 8,
        baseReward: 100
      });

      expect(firstPlace.items.length).toBeGreaterThan(0);
      expect(lastPlace.items.length).toBe(0);
    });
  });
}); 