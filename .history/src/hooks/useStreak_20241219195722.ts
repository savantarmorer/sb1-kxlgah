import { useGame } from '../contexts/GameContext';
import { Achievement, AchievementTrigger } from '../types/achievements';
import { supabase } from '../lib/supabase.ts';
import { XP_MULTIPLIERS } from '../lib/gameConfig';

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
 * Used for creating streak-based achievements when milestones are reached
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
    unlocked_at: new Date().toISOString(),
    prerequisites: [],
    dependents: [],
    trigger_conditions: [{
      type: triggerCondition.type as AchievementTrigger['type'],
      value: triggerCondition.value,
      comparison: triggerCondition.comparison
    }],
    order_num: 10
  };
}

/**
 * Calculates streak-based rewards based on the current streak
 * Maps to XP_MULTIPLIERS from gameConfig
 */
function calculateStreakReward(streak: number) {
  let multiplier = 1;
  for (const [days, value] of Object.entries(XP_MULTIPLIERS.streak)) {
    if (streak >= Number(days)) {
      multiplier = value;
    }
  }
  
  return {
    type: 'streak_bonus' as const,
    value: Math.floor(100 * multiplier),
    rarity: streak >= 30 ? 'legendary' : streak >= 14 ? 'epic' : streak >= 7 ? 'rare' : 'common'
  };
}

/**
 * Hook for managing user streaks and related achievements
 * Dependencies:
 * - GameContext for state management
 * - Supabase for database operations
 * - XP_MULTIPLIERS for reward calculation
 * 
 * Database Tables:
 * - user_progress: Stores streak data
 * - user_achievements: Stores unlocked achievements
 * - battle_stats: Updates streak-related stats
 * 
 * Used By:
 * - Battle system
 * - Achievement system
 * - Reward system
 */
export function useStreak() {
  const { state, dispatch } = useGame();

  const handleStreakUpdate = async (isVictory: boolean) => {
    if (!state.user) return;

    const newStreak = isVictory ? state.user.streak + 1 : 0;
    const currentHighestStreak = state.user.login_streak?.best || 0;
    
    // Update streak in database
    try {
      const { error } = await supabase
        .from('user_progress')
        .update({
          streak: newStreak,
          highest_streak: Math.max(currentHighestStreak, newStreak),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', state.user.id);

      if (error) throw error;

      // Update local state
      dispatch({
        type: 'UPDATE_USER_PROFILE',
        payload: {
          streak: newStreak,
          login_streak: {
            current: newStreak,
            best: Math.max(currentHighestStreak, newStreak),
            last_login: new Date().toISOString()
          }
        }
      });

      // Check for streak-based rewards and achievements
      if (newStreak > 0) {
        // Handle streak rewards
        if (newStreak % 5 === 0) {
          const streakReward = calculateStreakReward(newStreak);
          dispatch({
            type: 'UPDATE_REWARDS',
            payload: streakReward
          });
        }

        // Handle streak achievements
        const streakMilestones = [7, 30, 100];
        for (const milestone of streakMilestones) {
          if (newStreak === milestone) {
            const achievement = createStreakAchievement(
              `streak_${milestone}`,
              `${milestone} Day Streak`,
              `Maintained a ${milestone} day streak`,
              milestone * 10,
              {
                type: 'streak',
                value: milestone,
                comparison: 'gte'
              }
            );

            // Update achievements in database
            await supabase
              .from('user_achievements')
              .insert({
                user_id: state.user.id,
                achievement_id: achievement.id,
                unlocked_at: achievement.unlocked_at,
                progress: 100,
                updated_at: new Date().toISOString()
              });

            dispatch({
              type: 'UNLOCK_ACHIEVEMENTS',
              payload: [achievement]
            });
          }
        }
      }
    } catch (err) {
      console.error('Error updating streak:', err);
    }
  };

  return { handleStreakUpdate };
}

/**
 * System Integration:
 * - Updates user_progress table with streak data
 * - Triggers achievement unlocks based on streak milestones
 * - Calculates and applies streak-based rewards
 * - Maintains streak history in user_logins table
 * 
 * Features:
 * - Streak tracking and persistence
 * - Achievement integration
 * - Reward calculation
 * - Progress tracking
 * 
 * Scalability:
 * - Modular reward calculation
 * - Configurable multipliers
 * - Extensible achievement system
 * - Database-driven persistence
 */

