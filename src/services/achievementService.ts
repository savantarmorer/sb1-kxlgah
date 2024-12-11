import { supabase } from '../lib/supabaseClient';
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
    const { data: userAchievements, error: userAchievementsError } = await supabase
      .from('user_achievements')
      .select(`
        achievement_id,
        progress,
        unlocked_at,
        updated_at,
        achievements (
          id,
          title,
          description,
          category,
          points,
          rarity,
          prerequisites,
          dependents,
          trigger_conditions,
          order_num,
          metadata
        )
      `)
      .eq('user_id', userId);

    if (userAchievementsError) {
      console.error('Error fetching user achievements:', userAchievementsError);
      throw userAchievementsError;
    }

    if (!userAchievements) {
      return [];
    }

    return (userAchievements as unknown as UserAchievementRow[]).map(ua => ({
      id: ua.achievements.id,
      title: ua.achievements.title,
      description: ua.achievements.description,
      category: ua.achievements.category,
      points: ua.achievements.points,
      rarity: ua.achievements.rarity as AchievementRarity,
      prerequisites: ua.achievements.prerequisites,
      dependents: ua.achievements.dependents,
      trigger_conditions: ua.achievements.trigger_conditions,
      order_num: ua.achievements.order_num,
      icon: ua.achievements.metadata?.icon || '🏆',
      metadata: ua.achievements.metadata || {},
      unlocked: !!ua.unlocked_at,
      unlocked_at: ua.unlocked_at || undefined,
      progress: ua.progress || 0
    }));
  }

  static async checkTriggers(
    userId: string,
    triggerType: string,
    value: number,
    currentAchievements: Achievement[]
  ): Promise<Achievement[]> {
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select('*')
      .contains('trigger_conditions', [{ type: triggerType }]);

    if (error) {
      console.error('Error checking achievement triggers:', error);
      throw error;
    }

    if (!achievements) {
      return [];
    }

    const unlockedAchievements: Achievement[] = [];

    for (const achievement of achievements) {
      const isUnlocked = currentAchievements.some(a => a.id === achievement.id && a.unlocked);
      if (isUnlocked) continue;

      const meetsConditions = achievement.trigger_conditions.every((condition: TriggerCondition) => {
        if (condition.type !== triggerType) return true;
        switch (condition.comparison) {
          case 'eq': return value === condition.value;
          case 'gt': return value > condition.value;
          case 'gte': return value >= condition.value;
          case 'lt': return value < condition.value;
          case 'lte': return value <= condition.value;
          default: return false;
        }
      });

      if (meetsConditions) {
        await this.unlockAchievement(userId, achievement.id);
        unlockedAchievements.push({
          ...achievement,
          rarity: achievement.rarity as AchievementRarity,
          icon: achievement.metadata?.icon || '🏆',
          metadata: achievement.metadata || {},
          unlocked: true,
          unlocked_at: new Date().toISOString(),
          progress: 100
        });
      }
    }

    return unlockedAchievements;
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
      .select('*')
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
      unlocked: false,
      progress: 0
    })) || [];
  }

  static async create(achievement: Partial<Achievement>): Promise<Achievement> {
    const { data, error } = await supabase
      .from('achievements')
      .insert([{
        id: crypto.randomUUID(),
        ...achievement,
        rarity: achievement.rarity || 'common',
        metadata: {
          ...(achievement.metadata || {}),
          icon: achievement.icon || '🏆'
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
      throw new Error('No data returned from create operation');
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
    const { data, error } = await supabase
      .from('achievements')
      .update({
        ...achievement,
        metadata: {
          ...(achievement.metadata || {}),
          icon: achievement.icon || '🏆'
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