import { supabase } from '../lib/supabase';
import { Quest, QuestRequirementDB } from '../types/quests';
import { formatQuestForDB, formatQuestFromDB } from '../utils/formatters';
import { NotificationSystem } from '../utils/notifications';

export class QuestService {
  static async createQuest(quest: Partial<Quest>): Promise<Quest> {
    try {
      const dbQuest = formatQuestForDB(quest);
      const { data, error } = await supabase
        .from('quests')
        .insert([dbQuest])
        .select()
        .single();

      if (error) throw error;

      // Create requirements if any
      if (quest.requirements?.length) {
        const requirements: QuestRequirementDB[] = quest.requirements.map(req => ({
          quest_id: data.id,
          type: req.type,
          value: req.amount,
          description: req.type,
          completed: false,
          id: `req_${Date.now()}_${Math.random()}`
        }));

        const { error: reqError } = await supabase
          .from('quest_requirements')
          .insert(requirements);

        if (reqError) throw reqError;
      }

      const formattedQuest = formatQuestFromDB(data);
      NotificationSystem.showSuccess('Quest created successfully');
      return formattedQuest;

    } catch (error) {
      NotificationSystem.showError('Failed to create quest');
      throw error;
    }
  }

  static async updateQuest(quest: Quest): Promise<Quest> {
    try {
      const dbQuest = formatQuestForDB(quest);
      const { data, error } = await supabase
        .from('quests')
        .update(dbQuest)
        .eq('id', quest.id)
        .select()
        .single();

      if (error) throw error;

      // Update requirements
      if (quest.requirements?.length) {
        await supabase
          .from('quest_requirements')
          .delete()
          .eq('quest_id', quest.id);

        const requirements: QuestRequirementDB[] = quest.requirements.map(req => ({
          quest_id: quest.id,
          type: req.type,
          value: req.amount,
          description: req.type,
          completed: false,
          id: `req_${Date.now()}_${Math.random()}`
        }));

        const { error: reqError } = await supabase
          .from('quest_requirements')
          .insert(requirements);

        if (reqError) throw reqError;
      }

      const formattedQuest = formatQuestFromDB(data);
      NotificationSystem.showSuccess('Quest updated successfully');
      return formattedQuest;

    } catch (error) {
      NotificationSystem.showError('Failed to update quest');
      throw error;
    }
  }

  static async deleteQuest(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('quests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      NotificationSystem.showSuccess('Quest deleted successfully');

    } catch (error) {
      NotificationSystem.showError('Failed to delete quest');
      throw error;
    }
  }

  static async updateQuestProgress(questId: string, progress: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('quests')
        .update({ progress })
        .eq('id', questId);

      if (error) throw error;

    } catch (error) {
      console.error('Failed to update quest progress:', error);
      throw error;
    }
  }
} 

