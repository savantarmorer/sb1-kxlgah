import { supabase } from '@/lib/supabase';

interface TournamentStats {
  total_matches: number;
  total_questions: number;
  average_score: number;
  completion_rate: number;
  average_match_duration: number;
}

interface PlayerStats {
  matches_played: number;
  matches_won: number;
  total_score: number;
  average_score: number;
  fastest_answer: number;
  accuracy_rate: number;
}

interface QuestionStats {
  total_attempts: number;
  correct_answers: number;
  average_time: number;
  difficulty_rating: number;
}

export class TournamentAnalytics {
  async getTournamentStats(tournamentId: string): Promise<TournamentStats> {
    const { data: matches, error: matchError } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', tournamentId);

    if (matchError) throw matchError;

    const { data: answers, error: answerError } = await supabase
      .from('match_answers')
      .select('*')
      .in(
        'match_id',
        matches.map((m) => m.id)
      );

    if (answerError) throw answerError;

    const completedMatches = matches.filter((m) => m.status === 'completed');
    const totalScore = matches.reduce(
      (sum, m) => sum + (m.player1_score || 0) + (m.player2_score || 0),
      0
    );

    const averageMatchDuration =
      completedMatches.reduce((sum, m) => {
        const duration = new Date(m.end_time).getTime() - new Date(m.start_time).getTime();
        return sum + duration;
      }, 0) / (completedMatches.length || 1);

    return {
      total_matches: matches.length,
      total_questions: answers.length,
      average_score: totalScore / (matches.length * 2 || 1),
      completion_rate: (completedMatches.length / matches.length) * 100,
      average_match_duration: averageMatchDuration / 1000 // Convert to seconds
    };
  }

  async getPlayerStats(userId: string, tournamentId?: string): Promise<PlayerStats> {
    const matchQuery = supabase
      .from('tournament_matches')
      .select('*')
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`);

    if (tournamentId) {
      matchQuery.eq('tournament_id', tournamentId);
    }

    const { data: matches, error: matchError } = await matchQuery;
    if (matchError) throw matchError;

    const matchIds = matches.map((m) => m.id);
    const { data: answers, error: answerError } = await supabase
      .from('match_answers')
      .select('*')
      .eq('user_id', userId)
      .in('match_id', matchIds);

    if (answerError) throw answerError;

    const matchesWon = matches.filter((m) => m.winner_id === userId).length;
    const totalScore = matches.reduce((sum, m) => {
      const score = m.player1_id === userId ? m.player1_score : m.player2_score;
      return sum + (score || 0);
    }, 0);

    const correctAnswers = answers.filter((a) => a.is_correct).length;
    const fastestAnswer = Math.min(...answers.map((a) => a.answer_time));

    return {
      matches_played: matches.length,
      matches_won: matchesWon,
      total_score: totalScore,
      average_score: totalScore / (matches.length || 1),
      fastest_answer: fastestAnswer,
      accuracy_rate: (correctAnswers / answers.length) * 100
    };
  }

  async getQuestionStats(questionId: string): Promise<QuestionStats> {
    const { data: answers, error } = await supabase
      .from('match_answers')
      .select('*')
      .eq('question_id', questionId);

    if (error) throw error;

    const correctAnswers = answers.filter((a) => a.is_correct);
    const averageTime =
      answers.reduce((sum, a) => sum + a.answer_time, 0) / (answers.length || 1);

    // Calculate dynamic difficulty rating based on success rate and answer times
    const successRate = correctAnswers.length / (answers.length || 1);
    const normalizedTime = averageTime / 30000; // Normalize to 30-second baseline
    const difficultyRating = Math.round(
      (1 - successRate) * 0.7 + normalizedTime * 0.3 * 10
    );

    return {
      total_attempts: answers.length,
      correct_answers: correctAnswers.length,
      average_time: averageTime,
      difficulty_rating: difficultyRating
    };
  }

  async generateTournamentReport(tournamentId: string): Promise<string> {
    const stats = await this.getTournamentStats(tournamentId);
    const { data: participants, error } = await supabase
      .from('tournament_participants')
      .select('user_id')
      .eq('tournament_id', tournamentId);

    if (error) throw error;

    let report = `Tournament Report\n`;
    report += `=================\n\n`;
    report += `Total Matches: ${stats.total_matches}\n`;
    report += `Total Questions: ${stats.total_questions}\n`;
    report += `Average Score: ${stats.average_score.toFixed(2)}\n`;
    report += `Completion Rate: ${stats.completion_rate.toFixed(2)}%\n`;
    report += `Average Match Duration: ${(stats.average_match_duration / 60).toFixed(
      2
    )} minutes\n\n`;

    // Add top performers
    const topPerformers = await Promise.all(
      participants.map(async (p) => {
        const stats = await this.getPlayerStats(p.user_id, tournamentId);
        return {
          user_id: p.user_id,
          ...stats
        };
      })
    );

    topPerformers.sort((a, b) => b.total_score - a.total_score);

    report += `Top Performers\n`;
    report += `=============\n\n`;
    for (let i = 0; i < Math.min(3, topPerformers.length); i++) {
      const player = topPerformers[i];
      report += `${i + 1}. User ${player.user_id}\n`;
      report += `   Matches Won: ${player.matches_won}/${player.matches_played}\n`;
      report += `   Average Score: ${player.average_score.toFixed(2)}\n`;
      report += `   Accuracy Rate: ${player.accuracy_rate.toFixed(2)}%\n\n`;
    }

    return report;
  }

  async updateLeaderboards(tournamentId: string): Promise<void> {
    const { data: participants, error } = await supabase
      .from('tournament_participants')
      .select('*')
      .eq('tournament_id', tournamentId);

    if (error) throw error;

    const stats = await Promise.all(
      participants.map(async (p) => {
        const playerStats = await this.getPlayerStats(p.user_id, tournamentId);
        return {
          tournament_id: tournamentId,
          user_id: p.user_id,
          score: playerStats.total_score,
          matches_won: playerStats.matches_won,
          accuracy_rate: playerStats.accuracy_rate
        };
      })
    );

    // Update leaderboard entries
    for (const stat of stats) {
      await supabase
        .from('tournament_leaderboard')
        .upsert(
          {
            ...stat,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'tournament_id,user_id'
          }
        );
    }
  }
} 