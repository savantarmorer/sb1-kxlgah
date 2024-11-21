import { useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { format } from 'date-fns';
import { Achievement, AchievementTrigger } from '../types/achievements';

/**
 * Type for streak-specific trigger conditions
 * Extends base AchievementTrigger with streak-specific types
 */
type StreakTriggerType = 'streak' | 'login_days';

/**
 * Interface for streak-specific achievement triggers
 * Matches the base AchievementTrigger structure
 */
interface StreakTrigger {
  type: StreakTriggerType;
  value: number;
  comparison: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
}

/**
 * Creates a standard Achievement object from streak data
 * Ensures type compatibility with Achievement interface
 */
function createStreakAchievement(
  id: string,
  title: string,
  description: string,
  points: number,
  triggerCondition: StreakTrigger
): Achievement {
  return {
    id,
    title,
    description,
    category: 'streaks',
    points,
    rarity: 'common',
    unlocked: true,
    unlockedAt: new Date(),
    prerequisites: [],
    dependents: [],
    triggerConditions: [{
      type: triggerCondition.type as AchievementTrigger['type'],
      value: triggerCondition.value,
      comparison: triggerCondition.comparison
    }],
    order: 10
  };
}

/**
 * Hook for managing user streaks and related achievements
 */
export function useStreak() {
  const { state, dispatch } = useGame();

  /**
   * Checks and updates streak status
   * Called on component mount and date changes
   */
  useEffect(() => {
    const checkStreak = () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const lastLogin = state.lastLoginDate;

      if (!lastLogin) {
        dispatch({ type: 'RECORD_LOGIN', payload: today });
        return;
      }

      const lastLoginDate = new Date(lastLogin);
      const currentDate = new Date();
      const daysDiff = Math.floor((currentDate.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Consecutive day login
        dispatch({ type: 'INCREMENT_STREAK' });
        dispatch({ type: 'RECORD_LOGIN', payload: today });
      } else if (daysDiff > 1) {
        // Streak broken
        if (state.user.streak >= 7) {
          // Create streak lost achievement
          const achievement = createStreakAchievement(
            'streak_lost',
            'Back to Square One',
            'Lose a streak of 7 or more days',
            50,
            {
              type: 'streak',
              value: 7,
              comparison: 'gte'
            }
          );

          dispatch({
            type: 'UNLOCK_ACHIEVEMENT',
            payload: achievement
          });
        }

        dispatch({ type: 'RESET_STREAK' });
        dispatch({ type: 'RECORD_LOGIN', payload: today });
      }

      // Update streak multiplier
      dispatch({ type: 'UPDATE_STREAK_MULTIPLIER' });
    };

    checkStreak();
  }, [state.lastLoginDate]);

  /**
   * Gets current streak bonus multiplier
   * @returns Current streak multiplier value
   */
  const getStreakBonus = (): number => {
    const streak = state.user.streak;
    if (streak < 3) return 1;
    if (streak < 7) return 1.2;
    if (streak < 14) return 1.5;
    if (streak < 30) return 2;
    return 3;
  };

  return {
    streak: state.user.streak,
    streakBonus: getStreakBonus()
  };
}

/**
 * Hook Dependencies:
 * - useGame: For accessing and modifying game state
 * - date-fns: For date formatting and calculations
 * - Achievement types: For achievement structure
 * 
 * State Management:
 * - Uses GameContext for streak tracking
 * - Dispatches streak-related actions
 * 
 * Used By:
 * - StreakDisplay component
 * - DailyRewardSystem component
 * - XPSystem component
 * 
 * Features:
 * - Streak tracking
 * - Streak bonus calculation
 * - Achievement unlocking
 * - Date-based validation
 * 
 * Scalability Considerations:
 * - Separate trigger type definitions
 * - Factory function for achievement creation
 * - Type-safe achievement generation
 * - Extensible trigger conditions
 * - Configurable bonus tiers
 */ 

