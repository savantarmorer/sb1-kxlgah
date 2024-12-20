import { supabase, getData } from '../lib/supabase.ts';
import { GameStatistics } from '../types/game';

export class StatisticsService {
  static async fetchStatistics(): Promise<GameStatistics | null> {
    try {
      // Fetch data from multiple tables in parallel
      const [questsData, battleData] = await Promise.all([
        getData('quests'),
        getData('battle_history')
      ]);

      return {
        total_xp: 0,
        total_coins: 0,
        battles_won: (battleData || []).filter((b: any) => b.isVictory).length,
        battles_lost: (battleData || []).filter((b: any) => !b.isVictory).length,
        current_streak: 0,
        highest_streak: 0,
        quests_completed: (questsData || []).length,
        achievements_unlocked: 0,
        last_active: new Date().toISOString(),
        total_questions_answered: 0,
        correct_answers: 0,
        accuracy_rate: 0,
        average_time: 0,
        subject_scores: {
          constitutional: 0,
          civil: 0,
          criminal: 0,
          administrative: 0
        },
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return null;
    }
  }

  static async updateStatistics(statistics: Partial<GameStatistics>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('statistics')
        .upsert({
          ...statistics,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating statistics:', error);
      return false;
    }
  }
}