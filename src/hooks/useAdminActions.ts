import { useGame } from '../contexts/GameContext';
import { useAdmin } from './useAdmin';
import { GameItem, User } from '../types';
import { Quest } from '../types/quests';
import { supabase } from '../lib/supabase';
import { convertItemToDB, convertItemFromDB } from '../utils/supabaseUtils';
import type { Database } from '../types/supabase';

interface AdminActions {
  saveQuest: (quest: Partial<Quest>) => Promise<Quest>;
  saveItem: (item: Partial<GameItem>) => Promise<GameItem>;
  updateUserProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  fetchStatistics: () => Promise<{
    activeUsers: number;
    completedQuests: number;
    purchasedItems: number;
  } | null>;
}

/**
 * Hook for admin-only actions
 * Provides administrative functionality with permission checks
 */
export function useAdminActions(): AdminActions {
  const { dispatch } = useGame();
  const { isAdmin } = useAdmin();

  /**
   * Saves or updates a quest
   * @param quest - Quest data to save
   * @returns Promise with saved quest
   */
  const saveQuest = async (quest: Partial<Quest>): Promise<Quest> => {
    if (!isAdmin) throw new Error('Admin access required');

    try {
      const { data, error } = await supabase
        .from('quests')
        .upsert([{
          title: quest.title,
          description: quest.description,
          type: quest.type || 'daily',
          status: quest.status || 'available',
          category: quest.category || 'general',
          xp_reward: quest.xpReward || 0,
          coin_reward: quest.coinReward || 0,
          requirements: quest.requirements || [],
          progress: quest.progress || 0,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from insert');

      const savedQuest = {
        ...data,
        xpReward: data.xp_reward,
        coinReward: data.coin_reward,
        isActive: data.is_active
      } as Quest;

      dispatch({
        type: quest.id ? 'UPDATE_QUEST' : 'ADD_QUEST',
        payload: savedQuest
      });

      return savedQuest;
    } catch (error) {
      console.error('Error saving quest:', error);
      throw error;
    }
  };

  /**
   * Saves or updates an item
   * @param item - Item data to save
   * @returns Promise with saved item
   */
  const saveItem = async (item: Partial<GameItem>): Promise<GameItem> => {
    if (!isAdmin) throw new Error('Admin access required');

    try {
      const dbItem = convertItemToDB(item);
      const { data, error } = await supabase
        .from('items')
        .upsert([dbItem])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from insert');

      const savedItem = convertItemFromDB(data);

      dispatch({
        type: item.id ? 'UPDATE_ITEM' : 'ADD_ITEM',
        payload: savedItem
      });

      return savedItem;
    } catch (error) {
      console.error('Error saving item:', error);
      throw error;
    }
  };

  /**
   * Updates a user's profile
   * @param userId - ID of user to update
   * @param updates - Profile updates
   */
  const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    if (!isAdmin) throw new Error('Admin access required');

    try {
      const { error } = await supabase
        .from('users')
        .update(updates as Database['public']['Tables']['users']['Update'])
        .eq('id', userId);

      if (error) throw error;

      dispatch({
        type: 'UPDATE_USER_PROFILE',
        payload: updates
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  /**
   * Fetches system statistics
   * @returns Promise with statistics data
   */
  const fetchStatistics = async () => {
    if (!isAdmin) return null;

    try {
      const [usersResult, questsResult, itemsResult] = await Promise.all([
        supabase.from('users').select('id'),
        supabase.from('quests').select('id'),
        supabase.from('items').select('id')
      ]);

      const stats = {
        activeUsers: (usersResult.data || []).length,
        completedQuests: (questsResult.data || []).length,
        purchasedItems: (itemsResult.data || []).length,
        lastUpdated: new Date().toISOString()
      };

      dispatch({
        type: 'SYNC_STATISTICS',
        payload: stats
      });

      return stats;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return null;
    }
  };

  return {
    saveQuest,
    saveItem,
    updateUserProfile,
    fetchStatistics
  };
}

/**
 * Hook Dependencies:
 * - useGame: For dispatching state updates
 * - useAdmin: For permission checks
 * - supabase: For database operations
 * - supabaseUtils: For data conversion
 * 
 * State Management:
 * - Dispatches to GameContext
 * - Handles database synchronization
 * 
 * Error Handling:
 * - Permission checks
 * - Database errors
 * - Data validation
 * 
 * Scalability:
 * - Modular action handlers
 * - Type-safe operations
 * - Centralized admin logic
 */ 

