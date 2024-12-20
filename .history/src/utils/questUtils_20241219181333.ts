import { Quest, QuestStatus, QuestProgress, QuestRequirement, QuestType } from '../types/quests';
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
  const completedQuests = quests.filter(q => q.status === QuestStatus.COMPLETED);

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
  if (!quest.requirements?.length) return true;

  return quest.requirements.every((req: QuestRequirement) => {
    switch (req.type) {
      case QuestType.STUDY:
        return (userState.study_time || 0) >= req.target;
      case QuestType.BATTLE:
        return (userState.battle_stats?.wins || 0) >= req.target;
      case QuestType.STREAK:
        return (userState.streak || 0) >= req.target;
      case QuestType.ACHIEVEMENT:
        return (userState.achievements?.length || 0) >= req.target;
      case QuestType.COLLECTION:
        return (userState.inventory?.items?.length || 0) >= req.target;
      case QuestType.SOCIAL:
        return (userState.battle_stats?.total_battles || 0) >= req.target;
      default:
        return false;
    }
  });
}

/**
 * Calculates current progress percentage for a quest
 * 
 * @param quest - Quest to calculate progress for
 * @param currentProgress - Current progress value
 * @returns QuestProgress object with completion status and rewards
 */
export function calculateQuestProgress(quest: Quest, currentProgress: number): QuestProgress {
  // Calculate if quest is completed based on all requirements being met
  const completed = quest.requirements.every(req => {
    const progress = (req.current / req.target) * 100;
    return progress >= 100;
  });

  return {
    completed,
    rewards: {
      xp: completed ? quest.xp_reward : 0,
      coins: completed ? quest.coin_reward : 0,
      items: [],
      metadata: {
        quest_id: quest.id,
        completion_date: completed ? new Date().toISOString() : undefined
      }
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
 * - QuestSystem component for progress tracking
 * - useQuests hook for quest management
 * - Achievement system for milestone tracking
 * - QuestService for quest completion validation
 * 
 * Features:
 * - Achievement checking based on quest completion
 * - Requirement validation against user state
 * - Progress calculation with rewards
 * - Type-safe operations
 * 
 * Scalability:
 * - Modular functions for easy extension
 * - Type-safe interfaces
 * - Configurable requirements
 * - Extensible reward system
 * 
 * Related Systems:
 * - Achievement system
 * - Progress tracking
 * - User state management
 * - Reward distribution
 * 
 * Error Handling:
 * - Null checks for optional fields
 * - Type validation
 * - Default values for missing data
 * - Graceful fallbacks
 */

