import { BATTLE_CONFIG } from '../config/battleConfig';
import { supabase } from '../lib/supabase';
import { BattleResults, BattleQuestion, BattleStats } from '../types/battle';

export class BattleService {
  static async getQuestions(
    count: number = BATTLE_CONFIG.questionsPerBattle,
    category?: string,
    difficulty?: number
  ): Promise<BattleQuestion[]> {
    try {
      let query = supabase
        .from('quiz_questions')
        .select(`
          id,
          question,
          quiz_answers!inner (
            id,
            answer_text,
            is_correct
          ),
          category_id,
          difficulty
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (category) {
        query = query.eq('category_id', category);
      }

      if (difficulty) {
        query = query.eq('difficulty', difficulty);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Database query error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No questions found in database');
      }

      // Filter valid questions and map to correct format
      const validQuestions = data
        .filter(q => q.quiz_answers?.length >= 4)
        .map(q => ({
          id: q.id,
          question: q.question,
          answers: q.quiz_answers.map(a => a.answer_text),
          correctAnswer: q.quiz_answers.findIndex(a => a.is_correct),
          category: q.category_id,
          difficulty: q.difficulty
        }))
        .filter(q => q.answers.length >= 4 && q.correctAnswer !== -1);

      if (validQuestions.length < count) {
        throw new Error(`Not enough valid questions found. Required: ${count}, Found: ${validQuestions.length}`);
      }

      // Shuffle and return required number of questions
      return validQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, count);

    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  }

  static async updateStats(
    userId: string,
    results: BattleResults,
    currentStats?: Partial<BattleStats>
  ): Promise<void> {
    try {
      const newStats = {
        user_id: userId,
        total_battles: (currentStats?.totalBattles || 0) + 1,
        wins: (currentStats?.wins || 0) + (results.isVictory ? 1 : 0),
        losses: (currentStats?.losses || 0) + (results.isVictory ? 0 : 1),
        total_xp_earned: (currentStats?.totalXpEarned || 0) + results.experienceGained,
        total_coins_earned: (currentStats?.totalCoinsEarned || 0) + results.coinsEarned,
        highest_streak: Math.max(
          currentStats?.highestStreak || 0,
          results.streakBonus / BATTLE_CONFIG.rewards.streakBonus.multiplier
        ),
        score_average: this.calculateNewAverageScore(
          results.scorePercentage,
          currentStats?.averageScore || 0,
          currentStats?.totalBattles || 0
        ),
        last_battle_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('battle_stats')
        .upsert(newStats);

      if (error) throw error;

      // Record battle history
      await this.recordBattleHistory(userId, results);
    } catch (error) {
      console.error('Error updating battle stats:', error);
    }
  }

  private static calculateNewAverageScore(
    newScore: number,
    currentAverage: number,
    totalBattles: number
  ): number {
    return Math.round(
      ((currentAverage * totalBattles) + newScore) / (totalBattles + 1)
    );
  }

  private static async recordBattleHistory(
    userId: string,
    results: BattleResults
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('battle_history')
        .insert({
          user_id: userId,
          score_player: results.totalScore,
          is_victory: results.isVictory,
          xp_earned: results.experienceGained,
          coins_earned: results.coinsEarned,
          streak_bonus: results.streakBonus
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording battle history:', error);
      // Don't throw - allow battle to continue even if history recording fails
    }
  }
}