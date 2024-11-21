import { BATTLE_CONFIG } from '../config/battleConfig';
import { supabase } from '../lib/supabase';
import { BattleResults, BattleQuestion, BattleStats } from '../types/battle';
import { mockQuestions } from '../lib/supabase';

export class BattleService {
  static async getQuestions(
    count: number = BATTLE_CONFIG.questionsPerBattle,
    category?: string,
    difficulty?: number
  ): Promise<BattleQuestion[]> {
    try {
      // Query from quiz_questions table
      let query = supabase
        .from('quiz_questions')
        .select(`
          id,
          question,
          quiz_answers (
            id,
            answer_text,
            is_correct
          ),
          category_id,
          difficulty
        `)
        .eq('is_active', true);

      if (category) {
        query = query.eq('category_id', category);
      }

      if (difficulty) {
        query = query.eq('difficulty', difficulty);
      }

      const { data, error } = await query
        .limit(count)
        .order('RANDOM()');

      if (error) {
        console.warn('Using mock questions due to error:', error);
        return mockQuestions;
      }

      if (!data || data.length === 0) {
        console.warn('No questions found in database, using mock questions');
        return mockQuestions;
      }

      // Transform the data into BattleQuestion format
      return data.map(q => {
        const answers = q.quiz_answers;
        const correctAnswerIndex = answers.findIndex(a => a.is_correct);
        
        return {
          id: q.id,
          question: q.question,
          answers: answers.map(a => a.answer_text),
          correctAnswer: correctAnswerIndex,
          category: q.category_id,
          difficulty: q.difficulty,
          timeLimit: BATTLE_CONFIG.timePerQuestion
        };
      });
    } catch (error) {
      console.warn('Using mock questions due to error:', error);
      return mockQuestions;
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
        average_score: this.calculateNewAverageScore(
          results.scorePercentage,
          currentStats?.averageScore || 0,
          currentStats?.totalBattles || 0
        ),
        last_battle_date: new Date().toISOString()
      };

      const { error } = await supabase
        .from('battle_stats')
        .upsert(newStats);

      if (error) throw error;

      // Record battle history
      await this.recordBattleHistory(userId, results);
    } catch (error) {
      console.error('Error updating battle stats:', error);
      // Don't throw - allow battle to continue even if stats update fails
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