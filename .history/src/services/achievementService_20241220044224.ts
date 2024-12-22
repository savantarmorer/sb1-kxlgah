import { supabase } from '../lib/supabase';
import { Achievement, AchievementProgress, TriggerCondition, AchievementRarity, AchievementReward, AchievementMilestone, MilestoneReward } from '../types/achievements';

/**
 * Interface representing a row in the user_achievements table with its related achievement data
 * Used for type safety when dealing with database responses
 */
interface UserAchievementRow {
  achievement_id: string;
  progress: number;
  unlocked_at: string | null;
  updated_at: string;
  ready_to_claim: boolean;
  claimed: boolean;
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

interface Reward {
  type: 'coins' | 'gems' | 'xp' | 'title' | 'avatar';
  value: number | string;
}

interface Milestone {
  progress: number;
  reward: Reward;
}

/**
 * Service class for managing achievements in the game
 * Handles CRUD operations, progress tracking, and achievement unlocking
 * Dependencies:
 * - Supabase client for database operations
 * - GameContext for state management
 * - Achievement types for type safety
 */
export class AchievementService {
  // Cache timeout in milliseconds (5 minutes)
  private static CACHE_TIMEOUT = 5 * 60 * 1000;
  private static achievementsCache: Map<string, { data: Achievement[]; timestamp: number }> = new Map();

  /**
   * Retrieves achievements for a specific user, with caching for performance
   * Creates missing user_achievement entries if needed
   * @param userId - The ID of the user
   * @returns Promise<Achievement[]> - List of achievements with user progress
   */
  static async getUserAchievements(userId: string): Promise<Achievement[]> {
    // Check cache first
    const cached = this.achievementsCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TIMEOUT) {
      return cached.data;
    }

    // Fetch from database if not cached or cache expired
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select(`
        *,
        user_achievements!left (
          user_id,
          unlocked_at,
          progress,
          ready_to_claim,
          claimed,
          updated_at
        )
      `)
      .eq('user_achievements.user_id', userId)
      .order('order_num', { ascending: true });

    if (error) {
      console.error('Error fetching user achievements:', error);
      throw error;
    }

    // Initialize missing user_achievement entries
    const achievementsWithoutProgress = achievements?.filter(
      achievement => !achievement.user_achievements?.[0]
    ) || [];

    if (achievementsWithoutProgress.length > 0) {
      // Use upsert instead of insert to handle duplicates
      const { error: insertError } = await supabase
        .from('user_achievements')
        .upsert(
          achievementsWithoutProgress.map(achievement => ({
            user_id: userId,
            achievement_id: achievement.id,
            progress: 0,
            unlocked_at: null,
            ready_to_claim: false,
            claimed: false,
            updated_at: new Date().toISOString()
          })),
          { 
            onConflict: 'user_id,achievement_id',
            ignoreDuplicates: true 
          }
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
            progress,
            ready_to_claim,
            claimed,
            updated_at
          )
        `)
        .eq('user_achievements.user_id', userId)
        .order('order_num', { ascending: true });

      if (refetchError) {
        console.error('Error refetching achievements:', refetchError);
        throw refetchError;
      }

      const processedAchievements = this.processAchievements(updatedAchievements);
      this.updateCache(userId, processedAchievements);
      return processedAchievements;
    }

    const processedAchievements = this.processAchievements(achievements);
    this.updateCache(userId, processedAchievements);
    return processedAchievements;
  }

  /**
   * Processes raw achievement data into the Achievement type
   * Handles default values and type conversions
   * @param achievements - Raw achievement data from database
   * @returns Achievement[] - Processed achievement list
   */
  private static processAchievements(achievements: any[]): Achievement[] {
    return achievements?.map(achievement => ({
      ...achievement,
      rarity: achievement.rarity as AchievementRarity,
      icon: achievement.metadata?.icon || '🏆',
      metadata: achievement.metadata || {},
      ready_to_claim: achievement.user_achievements?.[0]?.ready_to_claim || false,
      unlocked: achievement.user_achievements?.[0]?.unlocked_at != null,
      claimed: achievement.user_achievements?.[0]?.claimed || false,
      progress: achievement.user_achievements?.[0]?.progress || 0
    })) || [];
  }

  /**
   * Updates the achievements cache for a user
   * @param userId - The ID of the user
   * @param achievements - The achievements to cache
   */
  private static updateCache(userId: string, achievements: Achievement[]): void {
    this.achievementsCache.set(userId, {
      data: achievements,
      timestamp: Date.now()
    });
  }

  /**
   * Checks achievement triggers and updates progress
   * Called when relevant game events occur
   * Dependencies:
   * - battle_stats table for battle-related triggers
   * - user_progress table for progression triggers
   * - battle_history table for score triggers
   */
  static async checkTriggers(
    userId: string,
    triggerType: string,
    value: number,
    currentAchievements: Achievement[]
  ): Promise<Achievement[]> {
    console.log('Checking triggers:', { userId, triggerType, value });

    // Get current user stats
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
      battle_score: battleHistory?.[0]?.score_player || 0,
      quests_completed: userProgress?.quests_completed || 0,
      items_collected: userProgress?.items_collected || 0
    };

    console.log('Trigger map:', triggerMap);

    // Get achievements that might be triggered
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select(`
        *,
        user_achievements!left (
          user_id,
          unlocked_at,
          progress,
          ready_to_claim,
          claimed,
          updated_at
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
    const batch: Promise<void>[] = []; // For batch processing progress updates

    for (const achievement of achievements || []) {
      // Check prerequisites first
      if (achievement.prerequisites?.length > 0) {
        const prerequisitesMet = achievement.prerequisites.every((preReqId: string) => 
          currentAchievements.find(a => a.id === preReqId && a.unlocked)
        );
        if (!prerequisitesMet) continue;
      }

      // Check trigger conditions
      const triggerConditions = Array.isArray(achievement.trigger_conditions) 
        ? achievement.trigger_conditions 
        : [];

      console.log('Achievement trigger conditions:', {
        id: achievement.id,
        title: achievement.title,
        rawConditions: achievement.trigger_conditions,
        processedConditions: triggerConditions
      });

      const matchingTriggers = triggerConditions.filter(
        (t: TriggerCondition) => t.type === triggerType || triggerMap[t.type] !== undefined
      );

      if (!matchingTriggers.length) {
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
            progress = actualValue === trigger.value ? 100 : Math.min(100, Math.round((actualValue / trigger.value) * 100));
            break;
          case 'gt':
          case 'gte':
            progress = Math.min(100, Math.round((actualValue / trigger.value) * 100));
            break;
          case 'lt':
          case 'lte':
            progress = actualValue <= trigger.value ? 100 : Math.max(0, Math.round(100 - ((actualValue - trigger.value) / trigger.value) * 100));
            break;
          default:
            progress = 0;
        }

        // Ensure progress is between 0 and 100
        progress = Math.max(0, Math.min(100, progress));

        return {
          progress,
          shouldUnlock: this.evaluateTriggerCondition(trigger, actualValue)
        };
      });

      // Calculate overall progress and unlock status
      const overallProgress = Math.min(...triggerProgresses.map((t: { progress: number }) => t.progress));
      const shouldUnlock = triggerProgresses.every((t: { shouldUnlock: boolean }) => t.shouldUnlock);

      console.log('Achievement evaluation:', {
        id: achievement.id,
        title: achievement.title,
        triggerProgresses,
        overallProgress,
        shouldUnlock
      });

      // Queue progress update
      batch.push(this.updateProgress(userId, achievement.id, overallProgress));

      if (shouldUnlock && !achievement.user_achievements?.[0]?.unlocked_at) {
        // Instead of unlocking immediately, mark as ready to claim
        batch.push(this.markReadyToClaim(userId, achievement.id));
        updatedAchievements.push({
          ...achievement,
          rarity: achievement.rarity as AchievementRarity,
          icon: achievement.metadata?.icon || '🏆',
          metadata: achievement.metadata || {},
          ready_to_claim: true,
          unlocked: false,
          claimed: false,
          progress: 100
        });

        // Don't check dependents until actually claimed
      } else {
        updatedAchievements.push({
          ...achievement,
          rarity: achievement.rarity as AchievementRarity,
          icon: achievement.metadata?.icon || '🏆',
          metadata: achievement.metadata || {},
          ready_to_claim: achievement.user_achievements?.[0]?.ready_to_claim || false,
          unlocked: achievement.user_achievements?.[0]?.unlocked_at != null,
          claimed: achievement.user_achievements?.[0]?.claimed || false,
          progress: overallProgress
        });
      }
    }

    // Process all updates in parallel
    await Promise.all(batch);

    console.log('Updated achievements:', updatedAchievements);
    this.updateCache(userId, updatedAchievements);
    return updatedAchievements;
  }

  /**
   * Checks and updates dependent achievements when a prerequisite is unlocked
   * @param userId - The ID of the user
   * @param dependentIds - Array of dependent achievement IDs
   */
  private static async checkDependentAchievements(
    userId: string,
    dependentIds: string[]
  ): Promise<void> {
    const { data: dependents, error } = await supabase
      .from('achievements')
      .select('*')
      .in('id', dependentIds);

    if (error || !dependents) return;

    for (const dependent of dependents) {
      await this.checkTriggers(userId, 'dependency_check', 0, []);
    }
  }

  /**
   * Evaluates a single trigger condition
   * @param condition - The trigger condition to evaluate
   * @param value - The actual value to compare against
   * @returns boolean - Whether the condition is met
   */
  private static evaluateTriggerCondition(condition: TriggerCondition, value: number): boolean {
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

  /**
   * Unlocks an achievement for a user
   * Sets unlocked_at timestamp and progress to 100%
   */
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

    // Invalidate cache
    this.achievementsCache.delete(userId);
  }

  /**
   * Updates the progress of an achievement
   * @param userId - The ID of the user
   * @param achievementId - The ID of the achievement
   * @param progress - The new progress value (0-100)
   */
  static async updateProgress(
    userId: string,
    achievementId: string,
    progress: number
  ): Promise<void> {
    // First get current status
    const { data: current } = await supabase
      .from('user_achievements')
      .select('ready_to_claim, claimed')
      .match({ user_id: userId, achievement_id: achievementId })
      .single();

    const { error } = await supabase
      .from('user_achievements')
      .upsert({
        user_id: userId,
        achievement_id: achievementId,
        progress,
        updated_at: new Date().toISOString(),
        ready_to_claim: current?.ready_to_claim || false,
        claimed: current?.claimed || false
      });

    if (error) {
      console.error('Error updating achievement progress:', error);
      throw error;
    }

    // Invalidate cache
    this.achievementsCache.delete(userId);
  }

  /**
   * Retrieves all achievements without user-specific data
   * Used for admin dashboard and achievement browsing
   */
  static async getAll(): Promise<Achievement[]> {
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select(`
        *,
        user_achievements (
          unlocked_at,
          progress,
          ready_to_claim,
          claimed,
          updated_at
        )
      `)
      .order('order_num', { ascending: true });

    if (error) {
      console.error('Error fetching achievements:', error);
      throw error;
    }

    return this.processAchievements(achievements);
  }

  /**
   * Creates a new achievement
   * Generates a unique ID and sets default values
   * @param achievement - Partial achievement data
   */
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

    // Invalidate all caches since a new achievement is available
    this.achievementsCache.clear();

    return {
      ...data,
      rarity: data.rarity as AchievementRarity,
      icon: data.metadata?.icon || '🏆',
      metadata: data.metadata || {},
      unlocked: false,
      progress: 0
    };
  }

  /**
   * Updates an existing achievement
   * Preserves user progress while updating achievement details
   * @param id - Achievement ID
   * @param achievement - Updated achievement data
   */
  static async update(id: string, achievement: Partial<Achievement>): Promise<Achievement> {
    try {
      // Separate user_achievements fields from achievement fields
      const { claimed, ready_to_claim, progress, unlocked_at, ...achievementData } = achievement;

      // Update the achievement table
      const { data: updatedAchievement, error: achievementError } = await supabase
        .from('achievements')
        .update({
          ...achievementData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (achievementError) {
        console.error('Error updating achievement:', achievementError);
        throw achievementError;
      }

      // If we have user_achievements fields, update them
      if (claimed !== undefined || ready_to_claim !== undefined || progress !== undefined || unlocked_at !== undefined) {
        const { error: userAchievementError } = await supabase
          .from('user_achievements')
          .update({
            claimed,
            ready_to_claim,
            progress,
            unlocked_at,
            updated_at: new Date().toISOString()
          })
          .eq('achievement_id', id);

        if (userAchievementError) {
          console.error('Error updating user achievement:', userAchievementError);
          throw userAchievementError;
        }
      }

      // Invalidate cache
      this.achievementsCache.clear();

      return updatedAchievement;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  /**
   * Deletes an achievement and its related user progress
   * First deletes all related user_achievements records, then the achievement itself
   * @param id - Achievement ID
   */
  static async delete(id: string): Promise<void> {
    // Start a transaction to ensure both operations succeed or fail together
    const { error: deleteUserAchievementsError } = await supabase
      .from('user_achievements')
      .delete()
      .eq('achievement_id', id);

    if (deleteUserAchievementsError) {
      console.error('Error deleting user achievements:', deleteUserAchievementsError);
      throw deleteUserAchievementsError;
    }

    // Now delete the achievement itself
    const { error: deleteAchievementError } = await supabase
      .from('achievements')
      .delete()
      .eq('id', id);

    if (deleteAchievementError) {
      console.error('Error deleting achievement:', deleteAchievementError);
      throw deleteAchievementError;
    }

    // Invalidate all caches since an achievement was removed
    this.achievementsCache.clear();

    // Log successful deletion
    console.log('Successfully deleted achievement and related records:', id);
  }

  /**
   * Marks an achievement as ready to claim
   * Sets ready_to_claim flag and progress to 100%
   */
  static async markReadyToClaim(userId: string, achievementId: string): Promise<void> {
    const { error: achievementError, data: achievement } = await supabase
      .from('achievements')
      .select('title, points, rarity')
      .eq('id', achievementId)
      .single();

    if (achievementError) {
      console.error('Error fetching achievement details:', achievementError);
      throw achievementError;
    }

    const { error } = await supabase
      .from('user_achievements')
      .upsert({
        user_id: userId,
        achievement_id: achievementId,
        ready_to_claim: true,
        progress: 100,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error marking achievement as ready to claim:', error);
      throw error;
    }

    // Create notification for the achievement
    const { error: notificationError } = await supabase
      .from('notification_history')
      .insert({
        user_id: userId,
        type: 'achievement_ready',
        title: 'Achievement Ready to Claim!',
        message: `You've earned the achievement "${achievement.title}" (${achievement.points} points)!`,
        data: {
          achievement_id: achievementId,
          achievement_title: achievement.title,
          achievement_points: achievement.points,
          achievement_rarity: achievement.rarity,
          show_toast: true
        },
        created_at: new Date().toISOString()
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't throw here as the main operation succeeded
    }

    // Invalidate cache
    this.achievementsCache.delete(userId);
  }

  /**
   * Claims rewards for an achievement that is ready to claim
   * This will unlock the achievement and mark it as claimed
   * @param userId - The ID of the user
   * @param achievementId - The ID of the achievement
   * @returns Promise<boolean> - Whether the claim was successful
   */
  static async claimAchievement(userId: string, achievementId: string): Promise<boolean> {
    try {
      // First check if achievement is ready to claim
      const { data: achievementData, error: achievementError } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .match({ user_id: userId, achievement_id: achievementId })
        .single();

      if (achievementError) {
        console.error('Error fetching achievement:', achievementError);
        return false;
      }

      if (!achievementData || !achievementData.ready_to_claim) {
        console.error('Achievement is not ready to claim');
        return false;
      }

      // Get rewards and milestones
      const [rewards, milestones] = await Promise.all([
        this.getRewards(achievementId),
        this.getMilestones(achievementId)
      ]);

      // Get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('coins, gems, xp')
        .eq('id', userId)
        .single();

      if (profileError || !userProfile) {
        console.error('Error fetching user profile:', profileError);
        return false;
      }

      // Calculate rewards
      let coinsToAdd = 0;
      let gemsToAdd = 0;
      let xpToAdd = 0;

      // Process main rewards
      rewards.forEach(reward => {
        switch (reward.type) {
          case 'coins':
            coinsToAdd += Number(reward.value);
            break;
          case 'gems':
            gemsToAdd += Number(reward.value);
            break;
          case 'xp':
            xpToAdd += Number(reward.value);
            break;
        }
      });

      // Process milestone rewards for reached milestones
      milestones.forEach(milestone => {
        if (achievementData.progress >= milestone.progress && milestone.reward) {
          switch (milestone.reward.type) {
            case 'coins':
              coinsToAdd += Number(milestone.reward.value);
              break;
            case 'gems':
              gemsToAdd += Number(milestone.reward.value);
              break;
            case 'xp':
              xpToAdd += Number(milestone.reward.value);
              break;
          }
        }
      });

      // Update user profile with rewards
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          coins: userProfile.coins + coinsToAdd,
          gems: userProfile.gems + gemsToAdd,
          xp: userProfile.xp + xpToAdd,
        })
        .eq('id', userId);

      if (updateProfileError) {
        console.error('Error updating user profile:', updateProfileError);
        return false;
      }

      // Update achievement status
      const { error: updateAchievementError } = await supabase
        .from('user_achievements')
        .update({ 
          claimed: true,
          unlocked_at: new Date().toISOString(),
          ready_to_claim: false 
        })
        .match({ user_id: userId, achievement_id: achievementId });

      if (updateAchievementError) {
        console.error('Error claiming achievement:', updateAchievementError);
        return false;
      }

      // Create reward notification
      const rewardMessage = [
        coinsToAdd > 0 ? `${coinsToAdd} coins` : null,
        gemsToAdd > 0 ? `${gemsToAdd} gems` : null,
        xpToAdd > 0 ? `${xpToAdd} XP` : null,
      ].filter(Boolean).join(', ');

      if (rewardMessage) {
        const { error: notificationError } = await supabase
          .from('notification_history')
          .insert({
            user_id: userId,
            type: 'achievement_claimed',
            title: 'Achievement Rewards Claimed!',
            message: `You received: ${rewardMessage}`,
            data: {
              achievement_id: achievementId,
              rewards: {
                coins: coinsToAdd,
                gems: gemsToAdd,
                xp: xpToAdd
              },
              show_toast: true
            },
            created_at: new Date().toISOString()
          });

        if (notificationError) {
          console.error('Error creating reward notification:', notificationError);
          // Don't fail the claim just because notification failed
        }
      }

      // Invalidate user's cache
      this.achievementsCache.delete(userId);
      return true;
    } catch (error) {
      console.error('Error in claimAchievement:', error);
      return false;
    }
  }

  static async addReward(achievementId: string, reward: { type: string; value: number }): Promise<AchievementReward> {
    try {
      const { data, error } = await supabase
        .from('achievement_rewards')
        .insert({
          achievement_id: achievementId,
          type: reward.type,
          value: reward.value,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating reward:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from reward creation');
      }

      return data;
    } catch (error) {
      console.error('Error in addReward:', error);
      throw error;
    }
  }

  static async getRewards(achievementId: string): Promise<AchievementReward[]> {
    const { data, error } = await supabase
      .from('achievement_rewards')
      .select('*')
      .eq('achievement_id', achievementId);

    if (error) throw error;
    if (!data) return [];
    return data;
  }

  static async clearRewards(achievementId: string): Promise<void> {
    const { error } = await supabase
      .from('achievement_rewards')
      .delete()
      .eq('achievement_id', achievementId);

    if (error) throw error;
  }

  static async addMilestone(achievementId: string, milestone: { progress: number; description: string }): Promise<AchievementMilestone> {
    try {
      const { data, error } = await supabase
        .from('achievement_milestones')
        .insert({
          achievement_id: achievementId,
          progress: milestone.progress,
          description: milestone.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating milestone:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from milestone creation');
      }

      return data;
    } catch (error) {
      console.error('Error in addMilestone:', error);
      throw error;
    }
  }

  static async getMilestones(achievementId: string): Promise<(AchievementMilestone & { reward: MilestoneReward[] })[]> {
    const { data: milestones, error: milestonesError } = await supabase
      .from('achievement_milestones')
      .select(`
        *,
        reward:milestone_rewards(*)
      `)
      .eq('achievement_id', achievementId);

    if (milestonesError) throw milestonesError;
    if (!milestones) return [];

    return milestones;
  }

  static async clearMilestones(achievementId: string): Promise<void> {
    const { error } = await supabase
      .from('achievement_milestones')
      .delete()
      .eq('achievement_id', achievementId);

    if (error) throw error;
  }

  static async addMilestoneReward(milestoneId: string, reward: { type: string; value: number }): Promise<MilestoneReward> {
    try {
      const { data, error } = await supabase
        .from('milestone_rewards')
        .insert({
          milestone_id: milestoneId,
          type: reward.type,
          value: reward.value,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating milestone reward:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from milestone reward creation');
      }

      return data;
    } catch (error) {
      console.error('Error in addMilestoneReward:', error);
      throw error;
    }
  }
} 