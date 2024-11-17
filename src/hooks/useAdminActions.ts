import { useGame } from '../contexts/GameContext';
import { useAdmin } from './useAdmin';
import { GameItem, User } from '../types';
import { Quest, QuestRequirement, QuestType } from '../types/quests';
import { supabase } from '../lib/supabase';
import { 
  convertQuestToDB, 
  convertQuestFromDB, 
  convertItemToDB, 
  convertItemFromDB 
} from '../utils/supabaseUtils';
import type { Database } from '../types/supabase';

/**
 * Interface for admin-specific actions
 */
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
 * Interface for quest data with requirements
 */
interface QuestData extends Omit<Partial<Quest>, 'requirements'> {
  requirements?: QuestRequirement[];
  type?: QuestType;
}

/**
 * Hook for admin-specific actions
 * Provides CRUD operations for admin users
 */
export function useAdminActions(): AdminActions {
  const { dispatch } = useGame();
  const { isAdmin } = useAdmin();

  /**
   * Saves or updates a quest
   * @param questData - Quest data to save
   * @returns Promise with saved quest
   */
  const saveQuest = async (questData: QuestData) => {
    if (!isAdmin) throw new Error('Admin access required');
    
    try {
      // Convert quest data to proper type before saving
      const quest: Partial<Quest> = {
        ...questData,
        requirements: questData.requirements?.map(req => ({
          ...req,
          type: req.type,
          completed: req.completed || false
        }))
      };

      const dbQuest = convertQuestToDB(quest);
      const { data, error } = await supabase
        .from('quests')
        .upsert([dbQuest])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from insert');

      const formattedQuest = convertQuestFromDB(data);
      
      dispatch({
        type: quest.id ? 'UPDATE_QUEST' : 'ADD_QUEST',
        payload: formattedQuest
      });

      return formattedQuest;
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
  const saveItem = async (item: Partial<GameItem>) => {
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
   * 
   * Used by:
   * - UserManager
   * - AdminPanel
   */
  const updateUserProfile = async (userId: string, updates: Partial<User>) => {
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
   * 
   * Used by:
   * - Statistics component
   * - AdminDashboard
   */
  const fetchStatistics = async () => {
    if (!isAdmin) return null;

    try {
      const [usersResult, questsResult, itemsResult] = await Promise.all([
        supabase.from('users').select('id'),
        supabase.from('quests').select('id'),
        supabase.from('items').select('id')
      ]);

      return {
        activeUsers: (usersResult.data || []).length,
        completedQuests: (questsResult.data || []).length,
        purchasedItems: (itemsResult.data || []).length
      };
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