import { useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import { Quest } from '../types/quests';
import { supabase } from '../lib/supabase';
import { formatQuestForDB, formatQuestFromDB } from '../utils/formatters';

/**
 * Interface for quest deletion payload
 */
interface DeleteQuestPayload {
  id: string;
}

/**
 * Interface for quest progress update
 */
interface QuestProgressUpdate {
  questId: string;
  progress: number;
}

/**
 * Hook for managing quests in the game
 * Provides CRUD operations and progress tracking
 */
export function useQuests() {
  const { state, dispatch } = useGame();

  /**
   * Fetches all quests for the current user
   * @returns Promise with quests array
   */
  const fetchQuests = useCallback(async () => {
    try {
      const { data: questsData, error } = await supabase
        .from('quests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedQuests = questsData.map(formatQuestFromDB);

      dispatch({
        type: 'INITIALIZE_QUESTS',
        payload: formattedQuests
      });

      return formattedQuests;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch quests';
      console.error(message);
      return [];
    }
  }, [dispatch]);

  /**
   * Creates a new quest
   * @param quest - Quest data to create
   * @returns Promise with created quest
   */
  const createQuest = async (quest: Partial<Quest>) => {
    try {
      const dbQuest = formatQuestForDB(quest);
      const { data, error } = await supabase
        .from('quests')
        .insert([dbQuest])
        .select()
        .single();

      if (error) throw error;

      const formattedQuest = formatQuestFromDB(data);

      dispatch({
        type: 'ADD_QUEST',
        payload: formattedQuest
      });

      return formattedQuest;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create quest';
      console.error(message);
      throw err;
    }
  };

  /**
   * Updates an existing quest
   * @param quest - Quest data to update
   * @returns Promise with updated quest
   */
  const updateQuest = async (quest: Partial<Quest>) => {
    try {
      if (!quest.id) throw new Error('Quest ID is required for updates');

      const dbQuest = formatQuestForDB(quest);
      const { data, error } = await supabase
        .from('quests')
        .update(dbQuest)
        .eq('id', quest.id)
        .select()
        .single();

      if (error) throw error;

      const formattedQuest = formatQuestFromDB(data);

      dispatch({
        type: 'UPDATE_QUEST',
        payload: formattedQuest
      });

      return formattedQuest;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update quest';
      console.error(message);
      throw err;
    }
  };

  /**
   * Deletes a quest by ID
   * @param id - ID of the quest to delete
   */
  const deleteQuest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const payload: DeleteQuestPayload = { id };
      dispatch({
        type: 'REMOVE_QUEST',
        payload
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete quest';
      console.error(message);
      throw err;
    }
  };

  /**
   * Updates quest progress
   * @param questId - ID of the quest
   * @param progress - New progress value
   */
  const updateProgress = async (questId: string, progress: number) => {
    try {
      const { error } = await supabase
        .from('quests')
        .update({ progress })
        .eq('id', questId);

      if (error) throw error;

      const payload: QuestProgressUpdate = { questId, progress };
      dispatch({
        type: 'SYNC_QUEST_PROGRESS',
        payload
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update quest progress';
      console.error(message);
      throw err;
    }
  };

  return {
    quests: state.quests,
    fetchQuests,
    createQuest,
    updateQuest,
    deleteQuest,
    updateProgress
  };
}

/**
 * Hook Dependencies:
 * - useGame: For accessing and modifying game state
 * - supabase: For database operations
 * - formatters: For data transformation
 * 
 * State Management:
 * - Uses GameContext for global state
 * - Local caching through state.quests
 * 
 * Database Interactions:
 * - CRUD operations on quests table
 * - Progress tracking updates
 * 
 * Used By:
 * - QuestManager component
 * - QuestList component
 * - QuestProgress component
 * 
 * Features:
 * - Quest CRUD operations
 * - Progress tracking
 * - Error handling
 * - Data formatting
 * 
 * Scalability Considerations:
 * - Separate interfaces for payloads
 * - Type safety for all operations
 * - Error handling with proper messages
 * - Modular data formatting
 */
