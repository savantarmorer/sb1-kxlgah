import { Question, BattleResults } from '../types/battle';
import { Achievement } from '../types/achievements';

// Sample questions for development
const SAMPLE_QUESTIONS: Question[] = [
  {
    id: '1',
    question: 'What is the primary purpose of a Constitution?',
    answers: [
      'To establish and limit government power',
      'To collect taxes',
      'To regulate commerce',
      'To declare war'
    ],
    correctAnswer: 0
  },
  {
    id: '2',
    question: 'Which principle ensures separation of powers?',
    answers: [
      'Federalism',
      'Checks and balances',
      'Popular sovereignty',
      'Individual rights'
    ],
    correctAnswer: 1
  },
  {
    id: '3',
    question: 'What is "habeas corpus"?',
    answers: [
      'A tax law',
      'A property right',
      'A right to challenge unlawful detention',
      'A voting right'
    ],
    correctAnswer: 2
  }
];

/**
 * Service class for managing battle-related operations
 * 
 * Dependencies:
 * - Question type from battle types
 * - Achievement type from achievements
 * - Battle achievements configuration
 * 
 * Used by:
 * - useBattle hook
 * - BattleMode component
 * - Admin battle management
 */
export class BattleService {
  /**
   * Retrieves questions for a battle
   * Can be filtered by category and difficulty
   * 
   * @param count - Number of questions to retrieve
   * @param category - Optional category filter
   * @param difficulty - Optional difficulty filter
   */
  static async getQuestions(count: number, category?: string, difficulty?: number): Promise<Question[]> {
    // In a real implementation, this would fetch from an API/database
    // For now, return sample questions
    return SAMPLE_QUESTIONS.slice(0, count);
  }

  /**
   * Validates an answer for a given question
   * 
   * @param questionId - ID of the question
   * @param answer - User's answer index
   */
  static validateAnswer(questionId: string, answer: number): boolean {
    // In real implementation, validate against correct answer from DB
    return true; // Placeholder
  }

  /**
   * Calculates time bonus based on remaining time
   * 
   * @param timeLeft - Remaining time in seconds
   */
  static calculateTimeBonus(timeLeft: number): number {
    return Math.floor(timeLeft * 0.5);
  }

  /**
   * Calculates streak bonus based on current streak
   * 
   * @param streak - Current user streak
   */
  static calculateStreakBonus(streak: number): number {
    return Math.floor(streak * 0.1 * 100);
  }

  /**
   * Checks for achievements based on battle results
   * 
   * @param results - Battle results
   * @param userStreak - Current user streak
   */
  static checkAchievements(results: BattleResults, userStreak: number): Achievement[] {
    const achievements: Achievement[] = [];

    // Perfect battle achievement
    if (results.score === results.totalQuestions) {
      achievements.push({
        id: 'perfect_battle',
        title: 'Perfect Scholar',
        description: 'Answer all questions correctly in a battle',
        category: 'battles',
        points: 100,
        rarity: 'legendary',
        unlocked: true,
        unlockedAt: new Date(),
        prerequisites: [],
        dependents: [],
        triggerConditions: [{
          type: 'battle_score',
          value: 100,
          comparison: 'eq'
        }],
        order: 100,
        metadata: {
          icon: '🎯',
          color: 'text-yellow-500'
        }
      });
    }

    // Battle streak achievement
    if (userStreak >= 3) {
      achievements.push({
        id: 'battle_streak_3',
        title: 'Battle Master',
        description: 'Win 3 battles in a row',
        category: 'battles',
        points: 50,
        rarity: 'epic',
        unlocked: true,
        unlockedAt: new Date(),
        prerequisites: [],
        dependents: [],
        triggerConditions: [{
          type: 'battle_streak',
          value: 3,
          comparison: 'gte'
        }],
        order: 90,
        metadata: {
          icon: '⚔️',
          color: 'text-purple-500'
        }
      });
    }

    return achievements;
  }

  /**
   * Calculates final battle rewards
   * 
   * @param score - Player's score
   * @param totalQuestions - Total number of questions
   * @param streakBonus - Streak bonus points
   * @param isVictory - Whether the player won
   */
  static calculateRewards(
    score: number,
    totalQuestions: number,
    streakBonus: number,
    isVictory: boolean
  ): { xp: number; coins: number } {
    const baseXP = score * 50;
    const baseCoins = score * 20;
    const victoryBonus = isVictory ? { xp: 100, coins: 50 } : { xp: 0, coins: 0 };

    return {
      xp: baseXP + streakBonus + victoryBonus.xp,
      coins: baseCoins + victoryBonus.coins
    };
  }

  // Private helper methods
  private static async fetchQuestionsFromDB(
    count: number,
    category?: string,
    difficulty?: number
  ): Promise<Question[]> {
    // Implement actual DB fetch logic here
    return [];
  }

  private static shuffleQuestions(questions: Question[]): Question[] {
    return [...questions].sort(() => Math.random() - 0.5);
  }
}

/**
 * Service Role:
 * - Central management of battle-related business logic
 * - Question retrieval and validation
 * - Reward calculations
 * - Achievement checking
 * - Battle results processing
 * 
 * Scalability Considerations:
 * - Separated concerns (questions, rewards, achievements)
 * - Async/await ready for API integration
 * - Configurable bonus calculations
 * - Extensible achievement system
 * 
 * Future Improvements:
 * - Cache frequently used questions
 * - Add difficulty progression
 * - Implement matchmaking logic
 * - Add battle statistics tracking
 */ 