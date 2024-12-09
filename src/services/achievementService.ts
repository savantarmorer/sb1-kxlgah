import { supabase } from '@/lib/supabase';
import { BattleResults } from '@/types/battle';
import { AchievementTriggerType } from '@/hooks/useAchievements';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  points: number;
  trigger_conditions: {
    type: AchievementTriggerType;
    value: number;
    comparison: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
  }[];
  progress?: number;
}

interface UserAchievement {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress?: number;
}

/**
 * Updates battle-related achievements based on battle results
 */
export async function updateBattleAchievements(
  battleResult: BattleResults,
  userId: string
): Promise<void> {
  try {
    // Get user's current achievements
    const { data: userAchievements, error: fetchError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) throw fetchError;

    // Get all battle-related achievements
    const { data: battleAchievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .eq('category', 'battle');

    if (achievementsError) throw achievementsError;

    // Check for new achievements
    const newAchievements = battleAchievements?.filter(achievement => {
      const hasAchievement = userAchievements?.some(
        ua => ua.achievement_id === achievement.id
      );
      if (hasAchievement) return false;

      return checkBattleAchievement(achievement, battleResult);
    });

    // Insert new achievements
    if (newAchievements && newAchievements.length > 0) {
      const { error: insertError } = await supabase
        .from('user_achievements')
        .insert(
          newAchievements.map(achievement => ({
            user_id: userId,
            achievement_id: achievement.id,
            unlocked_at: new Date().toISOString()
          }))
        );

      if (insertError) throw insertError;
    }

    // Update achievement progress
    const progressUpdates = battleAchievements
      ?.filter(achievement => achievement.has_progress)
      .map(achievement => {
        const currentProgress = userAchievements?.find(
          ua => ua.achievement_id === achievement.id
        )?.progress || 0;

        const newProgress = updateProgress(achievement, battleResult, currentProgress);

        return {
          user_id: userId,
          achievement_id: achievement.id,
          progress: newProgress
        };
      });

    if (progressUpdates && progressUpdates.length > 0) {
      const { error: updateError } = await supabase
        .from('user_achievements')
        .upsert(progressUpdates);

      if (updateError) throw updateError;
    }
  } catch (error) {
    console.error('Error updating battle achievements:', error);
    throw error;
  }
}

/**
 * Gets all achievements for a user
 */
export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select(`
      *,
      user_achievements!inner(*)
    `)
    .eq('user_achievements.user_id', userId);

  if (error) throw error;
  return data || [];
}

/**
 * Gets achievement progress for a user
 */
export async function getAchievementProgress(
  userId: string,
  achievementId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('progress')
    .eq('user_id', userId)
    .eq('achievement_id', achievementId)
    .single();

  if (error) throw error;
  return data?.progress || 0;
}

const checkBattleAchievement = (achievement: Achievement, battleResult: BattleResults): boolean => {
  switch (achievement.trigger_conditions[0]?.type) {
    case 'battle_wins':
      return battleResult.isVictory;
    case 'battle_score':
      return battleResult.score_player >= achievement.trigger_conditions[0].value;
    case 'battle_streak':
      return battleResult.streak_bonus >= achievement.trigger_conditions[0].value;
    default:
      return false;
  }
};

const updateProgress = (achievement: Achievement, battleResult: BattleResults, currentProgress: number): number => {
  switch (achievement.trigger_conditions[0]?.type) {
    case 'battle_wins':
      return battleResult.isVictory ? currentProgress + 1 : currentProgress;
    case 'battle_score':
      return currentProgress + battleResult.score_player;
    default:
      return currentProgress;
  }
}; 