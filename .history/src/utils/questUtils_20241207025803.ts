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
      trigger_conditions: [{
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
        return userState.battle_stats.wins >= req.value;
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
 * @param progress - Current progress percentage (0-100)
 * @returns QuestProgress object
 */
export function calculateQuestProgress(quest: Quest, progress: number): QuestProgress {
  const completed = progress >= quest.requirements[0].value;
  return {
    completed,
    rewards: {
      xp: completed ? quest.xp_reward : 0,
      coins: completed ? quest.coin_reward : 0,
      items: []
    }
  };
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

