import { supabase } from '@/lib/supabase';
import { MatchFeedback, TournamentFeedback } from '@/types/tournament.TODO';
import { TournamentError } from '@/errors/TournamentError';

export class FeedbackService {
  /**
   * Submit match feedback
   */
  static async submitMatchFeedback(feedback: MatchFeedback): Promise<void> {
    try {
      const { error } = await supabase
        .from('match_feedback')
        .insert(feedback);

      if (error) throw error;

      // Track feedback metrics
      await this.trackFeedbackMetrics('match', {
        rating: feedback.rating,
        latency: feedback.latency_rating,
        balance: feedback.balance_rating,
        issues: feedback.issues?.length || 0
      });
    } catch (error) {
      console.error('Error submitting match feedback:', error);
      throw new TournamentError('Failed to submit match feedback');
    }
  }

  /**
   * Submit tournament feedback
   */
  static async submitTournamentFeedback(feedback: TournamentFeedback): Promise<void> {
    try {
      const { error } = await supabase
        .from('tournament_feedback')
        .insert(feedback);

      if (error) throw error;

      // Track feedback metrics
      await this.trackFeedbackMetrics('tournament', {
        rating: feedback.overall_experience,
        format: feedback.format_rating,
        would_play_again: feedback.would_play_again ? 1 : 0
      });
    } catch (error) {
      console.error('Error submitting tournament feedback:', error);
      throw new TournamentError('Failed to submit tournament feedback');
    }
  }

  /**
   * Get feedback summary for a tournament
   */
  static async getTournamentFeedbackSummary(tournament_id: string) {
    try {
      const { data, error } = await supabase
        .from('tournament_feedback')
        .select('*')
        .eq('tournament_id', tournament_id);

      if (error) throw error;

      if (!data?.length) return null;

      const summary = {
        total_responses: data.length,
        average_rating: data.reduce((acc, f) => acc + f.overall_experience, 0) / data.length,
        would_play_again_rate: data.filter(f => f.would_play_again).length / data.length * 100,
        format_rating: data.reduce((acc, f) => acc + f.format_rating, 0) / data.length
      };

      return summary;
    } catch (error) {
      console.error('Error getting feedback summary:', error);
      throw new TournamentError('Failed to get feedback summary');
    }
  }

  /**
   * Get feedback summary for a match
   */
  static async getMatchFeedbackSummary(match_id: string) {
    try {
      const { data, error } = await supabase
        .from('match_feedback')
        .select('*')
        .eq('match_id', match_id);

      if (error) throw error;

      if (!data?.length) return null;

      const summary = {
        total_responses: data.length,
        average_rating: data.reduce((acc, f) => acc + f.rating, 0) / data.length,
        average_latency: data.reduce((acc, f) => acc + f.latency_rating, 0) / data.length,
        average_balance: data.reduce((acc, f) => acc + f.balance_rating, 0) / data.length,
        common_issues: this.getCommonIssues(data)
      };

      return summary;
    } catch (error) {
      console.error('Error getting feedback summary:', error);
      throw new TournamentError('Failed to get feedback summary');
    }
  }

  /**
   * Track feedback metrics
   */
  private static async trackFeedbackMetrics(type: 'match' | 'tournament', metrics: any) {
    try {
      await supabase
        .from('feedback_metrics')
        .insert({
          type,
          timestamp: new Date().toISOString(),
          metrics
        });
    } catch (error) {
      console.error('Error tracking feedback metrics:', error);
      // Don't throw to prevent disrupting the main flow
    }
  }

  /**
   * Get most common issues from feedback
   */
  private static getCommonIssues(feedback: MatchFeedback[]): Record<string, number> {
    const issues: Record<string, number> = {};
    
    feedback.forEach(f => {
      f.issues?.forEach(issue => {
        issues[issue] = (issues[issue] || 0) + 1;
      });
    });

    return issues;
  }
} 