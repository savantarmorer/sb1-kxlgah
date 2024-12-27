import { supabase } from '@/lib/supabase';
import { TournamentError } from '@/lib/errors';

interface CheatDetectionConfig {
  max_answer_time: number;  // Maximum time allowed to answer in milliseconds
  min_answer_time: number;  // Minimum time required to answer in milliseconds
  suspicious_streak: number;  // Number of consecutive fast correct answers to flag
  max_ip_accounts: number;  // Maximum accounts allowed from same IP
}

const DEFAULT_CONFIG: CheatDetectionConfig = {
  max_answer_time: 30000,  // 30 seconds
  min_answer_time: 2000,   // 2 seconds
  suspicious_streak: 5,     // 5 consecutive fast correct answers
  max_ip_accounts: 2
};

export class AntiCheatSystem {
  private config: CheatDetectionConfig;

  constructor(config: Partial<CheatDetectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async validateAnswer(
    userId: string,
    matchId: string,
    answerTime: number,
    isCorrect: boolean
  ): Promise<void> {
    try {
      // Check if answer time is within acceptable range
      if (answerTime > this.config.max_answer_time) {
        throw new TournamentError('Answer time exceeded limit');
      }

      if (answerTime < this.config.min_answer_time && isCorrect) {
        await this.flagSuspiciousActivity(userId, matchId, 'fast_correct_answer');
      }

      // Check for suspicious streaks
      if (isCorrect && answerTime < this.config.min_answer_time * 1.5) {
        const streak = await this.getCorrectAnswerStreak(userId, matchId);
        if (streak >= this.config.suspicious_streak) {
          await this.flagSuspiciousActivity(userId, matchId, 'suspicious_streak');
        }
      }

      // Record the answer for analysis
      await this.recordAnswer(userId, matchId, answerTime, isCorrect);
    } catch (error) {
      console.error('Anti-cheat validation error:', error);
      throw error;
    }
  }

  private async recordAnswer(
    userId: string,
    matchId: string,
    answerTime: number,
    isCorrect: boolean
  ): Promise<void> {
    const { error } = await supabase
      .from('match_answers')
      .insert({
        user_id: userId,
        match_id: matchId,
        answer_time: answerTime,
        is_correct: isCorrect,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  private async getCorrectAnswerStreak(
    userId: string,
    matchId: string
  ): Promise<number> {
    const { data, error } = await supabase
      .from('match_answers')
      .select('is_correct, answer_time')
      .eq('user_id', userId)
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(this.config.suspicious_streak);

    if (error) throw error;

    let streak = 0;
    for (const answer of data) {
      if (answer.is_correct && answer.answer_time < this.config.min_answer_time * 1.5) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private async flagSuspiciousActivity(
    userId: string,
    matchId: string,
    reason: string
  ): Promise<void> {
    // Record suspicious activity
    const { error: flagError } = await supabase
      .from('suspicious_activities')
      .insert({
        user_id: userId,
        match_id: matchId,
        reason,
        created_at: new Date().toISOString()
      });

    if (flagError) throw flagError;

    // Check if user should be automatically suspended
    const { count } = await supabase
      .from('suspicious_activities')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (count && count >= 3) {
      await this.suspendUser(userId);
    }
  }

  private async suspendUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        is_suspended: true,
        suspended_at: new Date().toISOString(),
        suspended_reason: 'Suspicious tournament activity detected'
      })
      .eq('id', userId);

    if (error) throw error;

    // End any active matches
    const { error: matchError } = await supabase
      .from('tournament_matches')
      .update({
        status: 'completed',
        end_time: new Date().toISOString(),
        winner_id: supabase.raw('CASE WHEN player1_id = ? THEN player2_id ELSE player1_id END', [userId])
      })
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .eq('status', 'in_progress');

    if (matchError) throw matchError;
  }

  async validateIPAddress(userId: string, ipAddress: string): Promise<void> {
    const { count } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact' })
      .eq('ip_address', ipAddress)
      .neq('user_id', userId);

    if (count && count >= this.config.max_ip_accounts) {
      await this.flagSuspiciousActivity(userId, null, 'multiple_accounts');
    }
  }

  async validateBrowserFingerprint(
    userId: string,
    fingerprint: string
  ): Promise<void> {
    const { count } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact' })
      .eq('browser_fingerprint', fingerprint)
      .neq('user_id', userId);

    if (count && count >= this.config.max_ip_accounts) {
      await this.flagSuspiciousActivity(userId, null, 'shared_device');
    }
  }
} 