import { supabase } from '../lib/supabase';
import { Achievement, AchievementProgress, TriggerCondition, AchievementRarity } from '../types/achievements';

interface UserAchievementRow {
  achievement_id: string;
  progress: number;
  unlocked_at: string | null;
  updated_at: string;
  achievements: {
    id: string;
    title: string;
    description: string;
    category: string;
    points: number;
    rarity: AchievementRarity;
    prerequisites: string[];
    dependents: string[];
    trigger_conditions: TriggerCondition[];
    order_num: number;
    metadata?: Record<string, any>;
  };
}

export class AchievementService {
  static async getUserAchievements(userId: string): Promise<Achievement[]> {
    // First, get all achievements
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select(`
        *,
        user_achievements!left (
          user_id,
          unlocked_at,
          progress
        )
      `)
      .eq('user_achievements.user_id', userId)
      .order('order_num', { ascending: true });

    if (error) {
      console.error('Error fetching user achievements:', error);
      throw error;
    }

    // Create user_achievements entries for achievements that don't have them
    const achievementsWithoutProgress = achievements?.filter(
      achievement => !achievement.user_achievements?.[0]
    ) || [];

    if (achievementsWithoutProgress.length > 0) {
      const { error: insertError } = await supabase
        .from('user_achievements')
        .insert(
          achievementsWithoutProgress.map(achievement => ({
            user_id: userId,
            achievement_id: achievement.id,
            progress: 0,
            unlocked_at: null
          }))
        );

      if (insertError) {
        console.error('Error initializing user achievements:', insertError);
        throw insertError;
      }

      // Refetch achievements after creating new entries
      const { data: updatedAchievements, error: refetchError } = await supabase
        .from('achievements')
        .select(`
          *,
          user_achievements!left (
            user_id,
            unlocked_at,
            progress
          )
        `)
        .eq('user_achievements.user_id', userId)
        .order('order_num', { ascending: true });

      if (refetchError) {
        console.error('Error refetching achievements:', refetchError);
        throw refetchError;
      }

      return updatedAchievements?.map(achievement => ({
        ...achievement,
        rarity: achievement.rarity as AchievementRarity,
        icon: achievement.metadata?.icon || '🏆',
        metadata: achievement.metadata || {},
        unlocked: achievement.user_achievements?.[0]?.unlocked_at != null,
        progress: achievement.user_achievements?.[0]?.progress || 0
      })) || [];
    }

    return achievements?.map(achievement => ({
      ...achievement,
      rarity: achievement.rarity as AchievementRarity,
      icon: achievement.metadata?.icon || '🏆',
      metadata: achievement.metadata || {},
      unlocked: achievement.user_achievements?.[0]?.unlocked_at != null,
      progress: achievement.user_achievements?.[0]?.progress || 0
    })) || [];
  }

  static async checkTriggers(
    userId: string,
    triggerType: string,
    value: number,
    currentAchievements: Achievement[]
  ): Promise<Achievement[]> {
    // First, get the current stats for the user
    const [
      { data: battleStats },
      { data: userProgress },
      { data: subjectScores }
    ] = await Promise.all([
      supabase
        .from('battle_stats')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('subject_scores')
        .select('*')
        .eq('user_id', userId)
    ]);

    // Get all achievements with this trigger type
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select(`
        *,
        user_achievements!left (
          user_id,
          unlocked_at,
          progress
        )
      `)
      .contains('trigger_conditions', JSON.stringify([{ type: triggerType }]))
      .eq('user_achievements.user_id', userId)
      .order('order_num', { ascending: true });

    if (error) {
      console.error('Error checking achievement triggers:', error);
      throw error;
    }

    const updatedAchievements: Achievement[] = [];

    for (const achievement of achievements || []) {
      const triggerCondition = achievement.trigger_conditions?.find(
        (t: any) => t.type === triggerType
      );

      if (!triggerCondition) continue;

      // Get the actual value based on trigger type
      let actualValue = value;
      switch (triggerType) {
        case 'battle_wins':
          actualValue = battleStats?.wins || 0;
          break;
        case 'battle_streak':
          actualValue = battleStats?.win_streak || 0;
          break;
        case 'highest_streak':
          actualValue = battleStats?.highest_streak || 0;
          break;
        case 'xp_gained':
          actualValue = userProgress?.xp || 0;
          break;
        case 'level_reached':
          actualValue = userProgress?.level || 1;
          break;
        case 'login_days':
          actualValue = userProgress?.streak || 0;
          break;
        case 'battle_rating':
          actualValue = battleStats?.tournament_rating || 0;
          break;
        case 'battles_played':
          actualValue = battleStats?.total_battles || 0;
          break;
        case 'coins_earned':
          actualValue = userProgress?.coins || 0;
          break;
        // Add more cases for other trigger types
      }

      // Calculate progress percentage based on the trigger condition
      let progressPercentage = 0;
      switch (triggerCondition.comparison) {
        case 'eq':
          progressPercentage = actualValue === triggerCondition.value ? 100 : Math.min(100, (actualValue / triggerCondition.value) * 100);
          break;
        case 'gt':
        case 'gte':
          progressPercentage = Math.min(100, (actualValue / triggerCondition.value) * 100);
          break;
        case 'lt':
        case 'lte':
          progressPercentage = actualValue <= triggerCondition.value ? 100 : Math.max(0, 100 - ((actualValue - triggerCondition.value) / triggerCondition.value) * 100);
          break;
        default:
          progressPercentage = 0;
      }

      // Update progress in user_achievements
      await this.updateProgress(userId, achievement.id, progressPercentage);

      // Check if achievement should be unlocked
      const shouldUnlock = this.evaluateTriggerCondition(triggerCondition, actualValue);

      if (shouldUnlock && !achievement.user_achievements?.[0]?.unlocked_at) {
        await this.unlockAchievement(userId, achievement.id);
        updatedAchievements.push({
          ...achievement,
          rarity: achievement.rarity as AchievementRarity,
          icon: achievement.metadata?.icon || '🏆',
          metadata: achievement.metadata || {},
          unlocked: true,
          progress: 100
        });
      } else {
        updatedAchievements.push({
          ...achievement,
          rarity: achievement.rarity as AchievementRarity,
          icon: achievement.metadata?.icon || '🏆',
          metadata: achievement.metadata || {},
          unlocked: achievement.user_achievements?.[0]?.unlocked_at != null,
          progress: progressPercentage
        });
      }
    }

    return updatedAchievements;
  }

  private static evaluateTriggerCondition(condition: any, value: number): boolean {
    switch (condition.comparison) {
      case 'eq':
        return value === condition.value;
      case 'gt':
        return value > condition.value;
      case 'gte':
        return value >= condition.value;
      case 'lt':
        return value < condition.value;
      case 'lte':
        return value <= condition.value;
      default:
        return false;
    }
  }

  static async unlockAchievement(userId: string, achievementId: string): Promise<void> {
    const { error } = await supabase
      .from('user_achievements')
      .upsert({
        user_id: userId,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString(),
        progress: 100
      });

    if (error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  }

  static async updateProgress(
    userId: string,
    achievementId: string,
    progress: number
  ): Promise<void> {
    const { error } = await supabase
      .from('user_achievements')
      .upsert({
        user_id: userId,
        achievement_id: achievementId,
        progress,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating achievement progress:', error);
      throw error;
    }
  }

  static async getAll(): Promise<Achievement[]> {
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select(`
        *,
        user_achievements (
          unlocked_at,
          progress
        )
      `)
      .order('order_num', { ascending: true });

    if (error) {
      console.error('Error fetching achievements:', error);
      throw error;
    }

    return achievements?.map(achievement => ({
      ...achievement,
      rarity: achievement.rarity as AchievementRarity,
      icon: achievement.metadata?.icon || '🏆',
      metadata: achievement.metadata || {},
      unlocked: achievement.user_achievements?.[0]?.unlocked_at != null,
      progress: achievement.user_achievements?.[0]?.progress || 0
    })) || [];
  }

  static async create(achievement: Partial<Achievement>): Promise<Achievement> {
    const { icon, metadata, progress, unlocked, unlocked_at, ...rest } = achievement;
    
    const achievementId = crypto.randomUUID();
    
    const prerequisites = Array.isArray(rest.prerequisites) ? rest.prerequisites : [];
    const dependents = Array.isArray(rest.dependents) ? rest.dependents : [];
    const trigger_conditions = Array.isArray(rest.trigger_conditions) ? rest.trigger_conditions : [];
    
    const { data, error } = await supabase
      .from('achievements')
      .insert([{
        id: achievementId,
        ...rest,
        prerequisites,
        dependents,
        trigger_conditions,
        rarity: rest.rarity || 'common',
        points: rest.points || 0,
        order_num: rest.order_num || 0,
        metadata: {
          ...(metadata || {}),
          icon: icon || '🏆'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating achievement:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from insert operation');
    }

    return {
      ...data,
      rarity: data.rarity as AchievementRarity,
      icon: data.metadata?.icon || '🏆',
      metadata: data.metadata || {},
      unlocked: false,
      progress: 0
    };
  }

  static async update(id: string, achievement: Partial<Achievement>): Promise<Achievement> {
    const { icon, metadata, progress, unlocked, unlocked_at, ...rest } = achievement;
    
    const { data, error } = await supabase
      .from('achievements')
      .update({
        ...rest,
        metadata: {
          ...(metadata || {}),
          icon: icon || '🏆'
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating achievement:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from update operation');
    }

    return {
      ...data,
      rarity: data.rarity as AchievementRarity,
      icon: data.metadata?.icon || '🏆',
      metadata: data.metadata || {},
      unlocked: false,
      progress: 0
    };
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('achievements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting achievement:', error);
      throw error;
    }
  }

  static async claimAchievement(userId: string, achievementId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_achievements')
      .update({ claimed: true })
      .match({ user_id: userId, achievement_id: achievementId });

    if (error) {
      console.error('Error claiming achievement:', error);
      return false;
    }

    return true;
  }
} 