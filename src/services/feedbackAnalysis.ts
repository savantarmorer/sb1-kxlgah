import { supabase } from '@/lib/supabase';
import type { MatchFeedback, TournamentFeedback } from '@/types/tournament.TODO';

export class FeedbackAnalysis {
  static async generateDailyReport() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    // Buscar feedback do dia
    const { data: feedbacks } = await supabase
      .from('feedback')
      .select('*')
      .gte('created_at', date.toISOString());

    if (!feedbacks) return null;

    // Separar por tipo
    const matchFeedbacks = feedbacks.filter(f => 'match_id' in f) as MatchFeedback[];
    const tournamentFeedbacks = feedbacks.filter(f => 'tournament_id' in f) as TournamentFeedback[];

    // Análise de matches
    const matchAnalysis = {
      averageRating: this.calculateAverage(matchFeedbacks.map(f => f.rating)),
      latencyIssues: matchFeedbacks.filter(f => f.latency_rating <= 2).length,
      balanceIssues: matchFeedbacks.filter(f => f.balance_rating <= 2).length,
      commonIssues: this.analyzeCommonIssues(matchFeedbacks)
    };

    // Análise de torneios
    const tournamentAnalysis = {
      averageExperience: this.calculateAverage(tournamentFeedbacks.map(f => f.overall_experience)),
      retentionRate: this.calculateRetention(tournamentFeedbacks),
      formatSatisfaction: this.calculateAverage(tournamentFeedbacks.map(f => f.format_rating)),
      suggestions: this.analyzeSuggestions(tournamentFeedbacks)
    };

    return {
      date: date.toISOString(),
      totalFeedbacks: feedbacks.length,
      matchAnalysis,
      tournamentAnalysis,
      recommendations: this.generateRecommendations({
        matchAnalysis,
        tournamentAnalysis
      })
    };
  }

  private static calculateAverage(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private static calculateRetention(feedbacks: TournamentFeedback[]): number {
    const wouldPlayAgain = feedbacks.filter(f => f.would_play_again).length;
    return (wouldPlayAgain / feedbacks.length) * 100;
  }

  private static analyzeCommonIssues(feedbacks: MatchFeedback[]): Record<string, number> {
    return feedbacks.reduce<Record<string, number>>((acc, feedback) => {
      feedback.issues?.forEach(issue => {
        acc[issue] = (acc[issue] || 0) + 1;
      });
      return acc;
    }, {});
  }

  private static analyzeSuggestions(feedbacks: TournamentFeedback[]): string[] {
    return feedbacks
      .filter(f => f.suggestions)
      .map(f => f.suggestions as string)
      .slice(0, 10); // Top 10 sugestões
  }

  private static generateRecommendations(analysis: any) {
    const recommendations = [];

    if (analysis.matchAnalysis.latencyIssues > 10) {
      recommendations.push('Investigate network performance issues');
    }

    if (analysis.matchAnalysis.balanceIssues > 10) {
      recommendations.push('Review matchmaking algorithm');
    }

    if (analysis.tournamentAnalysis.retentionRate < 70) {
      recommendations.push('Review tournament format and rewards');
    }

    return recommendations;
  }
} 