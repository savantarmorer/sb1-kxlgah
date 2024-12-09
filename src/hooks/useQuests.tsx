import { useState, useCallback, useEffect } from 'react';
import { use_game } from '../contexts/GameContext';
import { supabase } from '../lib/supabase';
import { Quest, QuestStatus } from '../types/quests';

export function useQuests() {
  const { state, dispatch } = use_game();
  const [loading, setLoading] = useState(false);

  const syncQuests = useCallback(async () => {
    setLoading(true);
    try {
      // Get all active quests with optional user progress
      const { data: questsData, error: questsError } = await supabase
        .from('quests')
        .select(`
          *,
          user_quests (
            status,
            progress,
            completed_at
          )
        `)
        .eq('is_active', true)
        .eq('user_quests.user_id', state.user?.id)
        .order('created_at', { ascending: false });

      if (questsError) throw questsError;

      const formattedQuests = questsData?.map(quest => ({
        id: quest.id,
        title: quest.title,
        description: quest.description,
        type: quest.type,
        status: (quest.user_quests?.[0]?.status || QuestStatus.AVAILABLE) as QuestStatus,
        category: quest.category || 'general',
        xp_reward: quest.xp_reward,
        coin_reward: quest.coin_reward,
        requirements: quest.requirements || [],
        progress: quest.user_quests?.[0]?.progress || 0,
        is_active: quest.is_active !== false,
        completed: quest.user_quests?.[0]?.completed_at !== null,
        created_at: quest.created_at,
        updated_at: quest.updated_at
      })) as Quest[];

      console.log('Synced quests:', formattedQuests);

      // Separate quests into active and completed
      const activeQuests = formattedQuests.filter(q => !q.completed);
      const completedQuests = formattedQuests.filter(q => q.completed);

      console.log('Active quests:', activeQuests);
      console.log('Completed quests:', completedQuests);

      dispatch({
        type: 'UPDATE_QUESTS',
        payload: {
          active: activeQuests,
          completed: completedQuests
        }
      });

      return formattedQuests;
    } catch (error) {
      console.error('Error syncing quests:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [dispatch, state.user?.id]);

  useEffect(() => {
    syncQuests();
  }, [syncQuests]);

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

