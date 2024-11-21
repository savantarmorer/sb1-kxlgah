import { Quest } from '../types/quests';
import { Achievement } from '../types/achievements';
import { GameState } from '../types/game';
import { User } from '../types/user';

/**
 * Type for score fields in User type
 */
type UserScoreField = keyof Pick<User, 
  'constitutionalScore' | 
  'civilScore' | 
  'criminalScore' | 
  'administrativeScore'
>;

/**
 * Checks for quest-related achievements based on quest completion
 * 
 * @param quests - Array of quests to check
 * @returns Array of unlocked achievements
 */
export function checkQuestAchievements(quests: Quest[]): Achievement[] {
  const achievements: Achievement[] = [];
  const completedQuests = quests.filter(q => q.status === 'completed');

  // Check for quest completion milestones
  if (completedQuests.length >= 10) {
    achievements.push({
      id: 'quest_master',
      title: 'Quest Master',
      description: 'Complete 10 quests',
      category: 'quests',
      points: 50,
      rarity: 'rare',
      unlocked: true,
      unlockedAt: new Date(),
      prerequisites: [],
      dependents: [],
      triggerConditions: [{
        type: 'quest_completion',
        value: 10,
        comparison: 'gte'
      }],
      order: 1
    });
  }

  return achievements;
}

/**
 * Checks if a quest's requirements are met based on user state
 * 
 * @param quest - Quest to check
 * @param userState - Current user state
 * @returns Boolean indicating if requirements are met
 */
export function checkQuestRequirements(quest: Quest, userState: GameState['user']): boolean {
  if (!quest.requirements) return true;

  return quest.requirements.every(req => {
    switch (req.type) {
      case 'score': {
        const scoreField = `${req.description.toLowerCase()}Score` as UserScoreField;
        return userState[scoreField] >= req.value;
      }
      case 'time':
        return userState.studyTime >= req.value;
      case 'battles':
        return userState.battleStats.wins >= req.value;
      case 'streak':
        return userState.streak >= req.value;
      default:
        return false;
    }
  });
}

/**
 * Calculates current progress percentage for a quest
 * 
 * @param quest - Quest to calculate progress for
 * @param userState - Current user state
 * @returns Progress percentage (0-100)
 */
export function calculateQuestProgress(quest: Quest, userState: GameState['user']): number {
  if (!quest.requirements || quest.requirements.length === 0) return 0;

  const progress = quest.requirements.map(req => {
    if (req.type === 'score') {
      const scoreField = `${req.description.toLowerCase()}Score` as UserScoreField;
      const current = userState[scoreField] || 0;
      return Math.min((current / req.value) * 100, 100);
    }
    return 0;
  });

  return Math.floor(progress.reduce((a, b) => a + b) / progress.length);
}

/**
 * Module Dependencies:
 * - Quest types from quests.ts
 * - Achievement types from achievements.ts
 * - GameState type from game.ts
 * - User type from user.ts
 * 
 * Used By:
 * - QuestSystem component
 * - useQuests hook
 * - Achievement system
 * 
 * Features:
 * - Achievement checking
 * - Requirement validation
 * - Progress calculation
 * 
 * Scalability:
 * - Type-safe operations
 * - Modular functions
 * - Easy to extend
 * - Configurable requirements
 * 
 * Related Systems:
 * - Achievement system
 * - Progress tracking
 * - User state management
 * 
 * Error Handling:
 * - Null checks
 * - Type validation
 * - Default values
 */

