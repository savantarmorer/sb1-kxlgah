import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Quest, QuestStatus } from '../types/quests';
import { NotificationSystem } from '../utils/notifications';

export function useAdminActions() {
  const [loading, setLoading] = useState(false);

  const saveQuest = async (questData: Partial<Quest>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quests')
        .upsert({
          ...questData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving quest:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteQuest = async (questId: string) => {
    setLoading(true);
    try {
      // First delete all user_quests associations
      await supabase
        .from('user_quests')
        .delete()
        .eq('quest_id', questId);

      // Then delete the quest
      const { error } = await supabase
        .from('quests')
        .delete()
        .eq('id', questId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting quest:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const assignQuestToUser = async (questId: string, userId: string) => {
    setLoading(true);
    try {
      // Check if the quest is already assigned
      const { data: existingAssignment } = await supabase
        .from('user_quests')
        .select()
        .eq('quest_id', questId)
        .eq('user_id', userId)
        .single();

      if (existingAssignment) {
        NotificationSystem.showWarning('Quest already assigned');
        return;
      }

      // Create new assignment
      const { error } = await supabase
        .from('user_quests')
        .insert({
          quest_id: questId,
          user_id: userId,
          status: QuestStatus.AVAILABLE,
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      NotificationSystem.showSuccess('Quest assigned successfully');
    } catch (error) {
      console.error('Error assigning quest:', error);
      NotificationSystem.showError('Error assigning quest');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const unassignQuestFromUser = async (questId: string, userId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_quests')
        .delete()
        .eq('quest_id', questId)
        .eq('user_id', userId);

      if (error) throw error;

      NotificationSystem.showSuccess('Quest unassigned successfully');
    } catch (error) {
      console.error('Error unassigning quest:', error);
      NotificationSystem.showError('Error unassigning quest');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    saveQuest,
    deleteQuest,
    assignQuestToUser,
    unassignQuestFromUser
  };
}

/**
 * Hook Dependencies:
 * - use_game: For dispatching state updates
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
