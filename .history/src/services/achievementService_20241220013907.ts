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
    console.log('Checking triggers:', { userId, triggerType, value });

    // First, get the current stats for the user
    const [
      { data: battleStats },
      { data: userProgress },
      { data: battleHistory }
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
        .from('battle_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
    ]);

    console.log('User stats:', { battleStats, userProgress, battleHistory });

    // Map trigger types to their corresponding stats
    const triggerMap: Record<string, number> = {
      battle_complete: battleStats?.total_battles || 0,
      battle_wins: battleStats?.wins || 0,
      battle_streak: battleStats?.win_streak || 0,
      highest_streak: battleStats?.highest_streak || 0,
      xp_gained: userProgress?.xp || 0,
      level_reached: userProgress?.level || 1,
      login_days: userProgress?.streak || 0,
      battle_rating: battleStats?.tournament_rating || 0,
      battles_played: battleStats?.total_battles || 0,
      coins_earned: userProgress?.coins || 0,
      battle_score: battleHistory?.[0]?.score_player || 0
    };

    console.log('Trigger map:', triggerMap);

    // Get all achievements that might be triggered
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
      console.error('Error checking achievement triggers:', error);
      throw error;
    }

    console.log('Found achievements:', achievements);

    const updatedAchievements: Achievement[] = [];

    for (const achievement of achievements || []) {
      // Check all trigger conditions for this achievement
      const matchingTriggers = achievement.trigger_conditions?.filter(
        (t: TriggerCondition) => t.type === triggerType || triggerMap[t.type] !== undefined
      );

      if (!matchingTriggers?.length) {
        console.log('No matching trigger conditions found for achievement:', achievement.id);
        continue;
      }

      console.log('Processing achievement:', {
        id: achievement.id,
        title: achievement.title,
        triggers: matchingTriggers
      });

      // Calculate progress for each trigger condition
      const triggerProgresses = matchingTriggers.map((trigger: TriggerCondition) => {
        const actualValue = trigger.type === triggerType ? value : triggerMap[trigger.type];
        
        console.log('Checking trigger:', {
          type: trigger.type,
          actualValue,
          required: trigger.value,
          comparison: trigger.comparison
        });

        let progress = 0;
        switch (trigger.comparison) {
          case 'eq':
            progress = actualValue === trigger.value ? 100 : Math.min(100, (actualValue / trigger.value) * 100);
            break;
          case 'gt':
          case 'gte':
            progress = Math.min(100, (actualValue / trigger.value) * 100);
            break;
          case 'lt':
          case 'lte':
            progress = actualValue <= trigger.value ? 100 : Math.max(0, 100 - ((actualValue - trigger.value) / trigger.value) * 100);
            break;
          default:
            progress = 0;
        }

        return {
          progress,
          shouldUnlock: this.evaluateTriggerCondition(trigger, actualValue)
        };
      });

      // Achievement progress is the minimum progress of all triggers
      const overallProgress = Math.min(...triggerProgresses.map((t: { progress: number }) => t.progress));
      // Achievement should unlock if all triggers are satisfied
      const shouldUnlock = triggerProgresses.every((t: { shouldUnlock: boolean }) => t.shouldUnlock);

      console.log('Achievement evaluation:', {
        id: achievement.id,
        title: achievement.title,
        triggerProgresses,
        overallProgress,
        shouldUnlock
      });

      // Update progress in user_achievements
      await this.updateProgress(userId, achievement.id, overallProgress);

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
          progress: overallProgress
        });
      }
    }

    console.log('Updated achievements:', updatedAchievements);
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