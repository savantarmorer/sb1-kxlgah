import { useState, useCallback, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { supabase } from '../lib/supabase.ts';
import { Quest } from '../types/quests';
import { formatQuestFromDB, formatQuestForDB } from '../utils/formatters';

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
 * Provides CRUD operations and progress tracking with auto-sync
 */
export function useQuests() {
  const { state, dispatch } = useGame();
  const [loading, setLoading] = useState(false);

  const syncQuests = useCallback(async () => {
    setLoading(true);
    try {
      const { data: questsData, error } = await supabase
        .from('quests')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedQuests = questsData?.map(formatQuestFromDB) as Quest[];

      dispatch({
        type: 'INITIALIZE_QUESTS',
        payload: formattedQuests
      });

      return formattedQuests;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sync quests';
      console.error(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // Fetch quests on component mount
  useEffect(() => {
    syncQuests();
  }, [syncQuests]);

  // Auto-sync every 30 seconds
  useEffect(() => {
    const interval = setInterval(syncQuests, 30 * 1000);
    return () => clearInterval(interval);
  }, [syncQuests]);

  return {
    quests: state.quests,
    loading,
    syncQuests
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
 * - Loading state management
 * 
 * Database Interactions:
 * - CRUD operations on quests table
 * - Progress tracking updates
 * - Automatic sync every 30 seconds
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
 * - Auto-sync functionality
 * 
 * Scalability Considerations:
 * - Separate interfaces for payloads
 * - Type safety for all operations
 * - Error handling with proper messages
 * - Modular data formatting
 * - Configurable sync interval
 */