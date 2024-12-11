import { supabase } from '../lib/supabase';
import { Quest, QuestStatus } from '../types/quests';
import { formatQuestFromDB, formatQuestForDB } from '../utils/formatters';
import { NotificationSystem } from '../utils/notifications';

export interface QuestService {
  updateQuestProgress: (userId: string, questId: string, progress: number) => Promise<void>;
  fetchAvailableQuests: (userId: string) => Promise<Quest[]>;
  fetchUserQuests: (userId: string) => Promise<Quest[]>;
}

export class QuestService {
  static async getQuests() {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data?.map(formatQuestFromDB) || [];
  }

  static async createQuest(quest: Partial<Quest>) {
    const dbQuest = formatQuestForDB(quest);
    const { data, error } = await supabase
      .from('quests')
      .insert([dbQuest])
      .select()
      .single();

    if (error) throw error;
    return formatQuestFromDB(data);
  }

  static async updateQuest(id: string, quest: Partial<Quest>) {
    const dbQuest = formatQuestForDB(quest);
    const { data, error } = await supabase
      .from('quests')
      .update(dbQuest)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return formatQuestFromDB(data);
  }

  static async deleteQuest(id: string) {
    const { error } = await supabase
      .from('quests')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async updateQuestProgress(userId: string, questId: string, progress: number) {
    const { error } = await supabase
      .from('user_quests')
      .upsert({
        user_id: userId,
        quest_id: questId,
        progress,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  static async getUserQuests(userId: string) {
    const { data, error } = await supabase
      .from('user_quests')
      .select(`
        *,
        quest:quests(*)
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data?.map(record => ({
      ...formatQuestFromDB(record.quest),
      progress: record.progress
    })) || [];
  }

  static async assignQuestToUser(userId: string, questId: string) {
    const { error } = await supabase
      .from('user_quests')
      .insert({
        user_id: userId,
        quest_id: questId,
        status: QuestStatus.AVAILABLE,
        progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  static async expireQuests() {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('user_quests')
      .update({ status: QuestStatus.FAILED })
      .lt('expires_at', now)
      .eq('status', QuestStatus.IN_PROGRESS);

    if (error) throw error;
  }

  static async grantRewards(userId: string, quest: Quest) {
    try {
      // Update user's XP and coins
      const { error: xpError } = await supabase
        .from('profiles')
        .update({
          xp: supabase.rpc('increment', { amount: quest.xp_reward }),
          coins: supabase.rpc('increment', { amount: quest.coin_reward })
        })
        .eq('id', userId);

      if (xpError) throw xpError;

      // Update quest status
      const { error: questError } = await supabase
        .from('user_quests')
        .update({
          status: QuestStatus.COMPLETED,
          completed_at: new Date().toISOString()
        })
        .eq('quest_id', quest.id)
        .eq('user_id', userId);

      if (questError) throw questError;

      NotificationSystem.showSuccess('Rewards granted successfully!');
    } catch (error) {
      console.error('Error granting rewards:', error);
      throw error;
    }
  }

  static async completeQuest(userId: string, questId: string): Promise<Quest[]> {
    const { data, error } = await supabase
      .from('user_quests')
      .update({ 
        status: QuestStatus.COMPLETED,
        completed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('quest_id', questId);

    if (error) throw error;
    return this.getUserQuests(userId);
  }
} 

