import { useGame } from '../contexts/GameContext';
import { Achievement, AchievementTrigger } from '../types/achievements';

/**
 * Interface for trigger check result
 */
interface TriggerCheckResult {
  met: boolean;
  progress?: number;
}

/**
 * Hook for managing achievements and progress
 */
export function useAchievements() {
  const { state, dispatch } = useGame();

  /**
   * Checks if a trigger condition is met
   * @param trigger - Achievement trigger to check
   * @returns Object containing whether condition is met and optional progress
   */
  const checkTriggerCondition = (trigger: AchievementTrigger): TriggerCheckResult => {
    const { type, value, comparison, metadata = {} } = trigger;
    let actualValue: number;
    let progress = 0;
    
    switch (type) {
      case 'xp':
        actualValue = state.user.xp;
        progress = (actualValue / value) * 100;
        break;

      case 'streak':
        actualValue = state.user.streak;
        progress = (actualValue / value) * 100;
        break;

      case 'quest':
        actualValue = state.completedQuests.length;
        progress = (actualValue / value) * 100;
        break;

      case 'study_time':
        actualValue = state.user.studyTime;
        progress = (actualValue / value) * 100;
        break;

      case 'score':
        const scoreType = metadata.scoreType as keyof typeof state.user;
        actualValue = (state.user[scoreType] as number) || 0;
        progress = (actualValue / value) * 100;
        break;

      case 'reward_rarity':
        // Implement reward rarity check logic
        actualValue = 0;
        progress = 0;
        break;

      case 'login_days':
        actualValue = state.loginHistory.length;
        progress = (actualValue / value) * 100;
        break;

      default:
        return { met: false, progress: 0 };
    }

    return {
      met: compareValue(actualValue, value, comparison),
      progress: Math.min(100, Math.max(0, progress))
    };
  };

  /**
   * Compares values based on comparison operator
   * @param actual - Actual value
   * @param expected - Expected value
   * @param operator - Comparison operator
   * @returns boolean result of comparison
   */
  const compareValue = (actual: number, expected: number, operator: AchievementTrigger['comparison']): boolean => {
    switch (operator) {
      case 'eq': return actual === expected;
      case 'gt': return actual > expected;
      case 'lt': return actual < expected;
      case 'gte': return actual >= expected;
      case 'lte': return actual <= expected;
      default: return false;
    }
  };

  /**
   * Updates achievement progress
   * @param achievementId - ID of achievement to update
   * @param progress - New progress value
   */
  const updateProgress = (achievementId: string, progress: number) => {
    const achievement = state.achievements.find(a => a.id === achievementId);
    if (!achievement) return;

    const updatedProgress = Math.min(100, Math.max(0, progress));
    const shouldUnlock = updatedProgress >= 100 && !achievement.unlocked;

    const updatedAchievement: Achievement = {
      ...achievement,
      progress: updatedProgress,
      unlocked: shouldUnlock,
      unlockedAt: shouldUnlock ? new Date() : achievement.unlockedAt
    };

    dispatch({
      type: 'UPDATE_ACHIEVEMENT_PROGRESS',
      payload: {
        id: achievementId,
        progress: updatedProgress
      }
    });

    if (shouldUnlock) {
      dispatch({
        type: 'UNLOCK_ACHIEVEMENT',
        payload: updatedAchievement
      });
    }
  };

  /**
   * Checks all achievement triggers and updates progress
   */
  const checkAchievements = () => {
    state.achievements.forEach(achievement => {
      if (achievement.unlocked) return;

      const triggerResults = achievement.triggerConditions.map(checkTriggerCondition);
      const allMet = triggerResults.every(result => result.met);
      const averageProgress = triggerResults.reduce((sum, result) => sum + (result.progress || 0), 0) / triggerResults.length;

      updateProgress(achievement.id, averageProgress);
    });
  };

  return {
    achievements: state.achievements,
    hasAchievement: (id: string) => state.achievements.some(a => a.id === id && a.unlocked),
    totalPoints: state.achievements.reduce((sum, a) => sum + (a.unlocked ? a.points : 0), 0),
    getProgress: (id: string) => state.achievements.find(a => a.id === id)?.progress || 0,
    updateProgress,
    checkAchievements
  };
}

/**
 * Hook Dependencies:
 * - useGame: For accessing and modifying game state
 * - Achievement types: For type definitions
 * 
 * State Management:
 * - Uses GameContext for achievement state
 * - Handles progress updates and unlocks
 * 
 * Used By:
 * - AchievementSystem component
 * - QuestSystem component
 * - RewardSystem component
 * 
 * Features:
 * - Achievement progress tracking
 * - Trigger condition checking
 * - Progress updates
 * - Points calculation
 * - Automatic achievement checking
 * 
 * Scalability Considerations:
 * - Modular trigger system
 * - Extensible comparison operators
 * - Progress calculation
 * - Type safety throughout
 * - Easy to add new trigger types
 */
