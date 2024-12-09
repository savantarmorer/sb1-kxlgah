import { use_game } from '../contexts/GameContext';
import { Achievement, AchievementTrigger } from '../types/achievements';
import { GameState } from '../types/game';

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
  const { state, dispatch } = use_game();

  /**
   * Checks if a trigger condition is met
   * @param trigger - Achievement trigger to check
   * @returns Object containing whether condition is met and optional progress
   */
  const check_trigger_condition = (trigger: AchievementTrigger): TriggerCheckResult => {
    const { type, value, comparison, metadata = {} } = trigger;
    let actual_value = 0;
    let progress = 0;
    
    switch (type) {
      case 'xp_gained':
        actual_value = Number(state.user.xp) || 0;
        progress = (actual_value / Number(value)) * 100;
        break;

      case 'highest_streak':
        actual_value = Number(state.user.streak) || 0;
        progress = (actual_value / Number(value)) * 100;
        break;

      case 'quests_completed':
        actual_value = state.completedQuests.length;
        progress = (actual_value / Number(value)) * 100;
        break;

      case 'battle_score':
        actual_value = Number(state.user.battle_rating) || 0;
        progress = (actual_value / Number(value)) * 100;
        break;

      case 'battle_wins':
        actual_value = Number(state.battle_stats?.wins) || 0;
        progress = (actual_value / Number(value)) * 100;
        break;

      case 'battle_streak':
        actual_value = Number(state.user.streak) || 0;
        progress = (actual_value / Number(value)) * 100;
        break;

      case 'battle_rating':
        actual_value = Number(state.user.battle_rating) || 0;
        progress = (actual_value / Number(value)) * 100;
        break;

      case 'reward_rarity':
        actual_value = 0;
        progress = 0;
        break;

      case 'login_days':
        actual_value = state.login_history.length;
        progress = (actual_value / Number(value)) * 100;
        break;

      default:
        return { met: false, progress: 0 };
    }

    return {
      met: compare_value(Number(actual_value), Number(value), comparison),
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
  const compare_value = (actual: number, expected: number, operator: AchievementTrigger['comparison']): boolean => {
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
   * @param achievement_id - ID of achievement to update
   * @param progress - New progress value
   */
  const update_progress = (achievement_id: string, progress: number) => {
    const achievement = state.achievements.find(a => a.id === achievement_id);
    if (!achievement) return;

    const updated_progress = Math.min(100, Math.max(0, progress));
    const should_unlock = updated_progress >= 100 && !achievement.unlocked;

    const updated_achievement: Achievement = {
      ...achievement,
      progress: updated_progress,
      unlocked: should_unlock,
      unlocked_at: should_unlock ? new Date().toISOString() : achievement.unlocked_at
    };

    dispatch({
      type: 'UPDATE_ACHIEVEMENT',
      payload: {
        id: achievement_id,
        progress: updated_progress
      }
    });

    if (should_unlock) {
      dispatch({
        type: 'UNLOCK_ACHIEVEMENT',
        payload: updated_achievement
      });
    }
  };

  /**
   * Checks all achievement triggers and updates progress
   */
  const check_achievements = () => {
    state.achievements.forEach(achievement => {
      if (achievement.unlocked) return;

      // Check prerequisites
      const prerequisites_met = achievement.prerequisites.every(preId => 
        state.achievements.find(a => a.id === preId)?.unlocked
      );

      if (!prerequisites_met) return;

      const trigger_results = achievement.trigger_conditions.map(check_trigger_condition);
      const all_met = trigger_results.every(result => result.met);
      const average_progress = trigger_results.reduce((sum, result) => sum + (result.progress || 0), 0) / trigger_results.length;

      // Only update progress if all conditions are met or there's partial progress
      if (all_met || average_progress > 0) {
        update_progress(achievement.id, average_progress);
      }
    });
  };

  return {
    achievements: state.achievements,
    has_achievement: (id: string) => state.achievements.some(a => a.id === id && a.unlocked),
    total_points: state.achievements.reduce((sum, a) => sum + (a.unlocked ? a.points : 0), 0),
    get_progress: (id: string) => state.achievements.find(a => a.id === id)?.progress || 0,
    update_progress,
    check_achievements
  };
}

/**
 * Hook Dependencies:
 * - use_game: For accessing and modifying game state
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

export type AchievementTriggerType = 
  | 'xp_gained'
  | 'highest_streak'
  | 'quests_completed'
  | 'battle_score'
  | 'battle_wins'
  | 'battle_streak'
  | 'battle_rating';

const calculateProgress = (
  type: AchievementTriggerType,
  value: number,
  metadata: Record<string, any>,
  gameState: GameState
): { actual_value: number; progress: number } => {
  let actual_value = 0;
  let progress = 0;

  switch (type) {
    case 'xp_gained':
      actual_value = Number(gameState.user.xp) || 0;
      break;
    case 'highest_streak':
      actual_value = Number(gameState.user.streak) || 0;
      break;
    case 'quests_completed':
      actual_value = gameState.completedQuests.length;
      break;
    case 'battle_score':
      actual_value = Number(gameState.user.battle_rating) || 0;
      break;
    case 'battle_wins':
      actual_value = Number(gameState.battle_stats?.wins) || 0;
      break;
    case 'battle_streak':
      actual_value = Number(gameState.user.streak) || 0;
      break;
    case 'battle_rating':
      actual_value = Number(gameState.user.battle_rating) || 0;
      break;
    default:
      console.warn(`Unsupported achievement type: ${type}`);
  }

  progress = (actual_value / Number(value)) * 100;
  return { actual_value, progress };
};

export { calculateProgress };
