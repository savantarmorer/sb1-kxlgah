import { useEffect, useState, useCallback } from 'react';
import { use_game } from '../contexts/GameContext';
import { DBbattle_stats } from '../types/battle';
import { Achievement } from '../types/achievements';
import { DailyReward } from '../types/rewards';

interface QuizStats {
  total_questions: number;
  correct_answers: number;
  average_time: number;
  streak: number;
  last_quiz_date: string;
}

interface StudyTime {
  today: number;
  total: number;
}

interface SubjectScores {
  constitutional: number;
  civil: number;
  criminal: number;
  administrative: number;
}

interface UserStats {
  battle: Omit<DBbattle_stats, 'user_id' | 'updated_at'> & { 
    win_rate: number;
    tournament_stats: {
      tournaments_played: number;
      tournaments_won: number;
      tournament_matches_played: number;
      tournament_matches_won: number;
      tournament_rating: number;
    };
  };
  achievements: {
    total: number;
    unlocked: number;
    progress: number;
    recent: Achievement[];
  };
  quiz: QuizStats;
  login: {
    current_streak: number;
    highest_streak: number;
    last_login: string;
    streak_maintained: boolean;
  };
  study: {
    time_today: number;
    time_total: number;
    subject_scores: SubjectScores;
  };
}

export function useUserStats() {
  const { state } = use_game();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const calculateStats = useCallback(() => {
    try {
      if (!state.user) {
        setStats(null);
        setLoading(false);
        return;
      }

      // Battle Stats
      const battle_stats: DBbattle_stats = {
        user_id: state.user.id,
        total_battles: 0,
        wins: 0,
        losses: 0,
        win_streak: 0,
        highest_streak: 0,
        total_xp_earned: 0,
        total_coins_earned: 0,
        updated_at: new Date().toISOString(),
        difficulty: 1,
        tournaments_played: 0,
        tournaments_won: 0,
        tournament_matches_played: 0,
        tournament_matches_won: 0,
        tournament_rating: 0,
        ...state.user.battle_stats
      };

      // Calculate win rate
      const totalBattles = battle_stats.total_battles || 0;
      const wins = battle_stats.wins || 0;
      const winRate = totalBattles > 0 ? (wins / totalBattles) * 100 : 0;

      const newStats: UserStats = {
        battle: {
          ...battle_stats,
          win_rate: winRate,
          tournament_stats: {
            tournaments_played: battle_stats.tournaments_played,
            tournaments_won: battle_stats.tournaments_won,
            tournament_matches_played: battle_stats.tournament_matches_played,
            tournament_matches_won: battle_stats.tournament_matches_won,
            tournament_rating: battle_stats.tournament_rating
          }
        },
        achievements: {
          total: state.achievements.length,
          unlocked: state.achievements.filter(a => a.unlocked).length,
          progress: state.achievements.length > 0 
            ? (state.achievements.filter(a => a.unlocked).length / state.achievements.length) * 100 
            : 0,
          recent: state.achievements
            .filter(a => a.unlocked)
            .sort((a, b) => {
              const dateA = a.unlocked_at ? new Date(a.unlocked_at).getTime() : 0;
              const dateB = b.unlocked_at ? new Date(b.unlocked_at).getTime() : 0;
              return dateB - dateA;
            })
            .slice(0, 5)
        },
        quiz: {
          total_questions: state.user.quiz_stats?.total_questions || 0,
          correct_answers: state.user.quiz_stats?.correct_answers || 0,
          average_time: state.user.quiz_stats?.average_time || 0,
          streak: state.user.quiz_stats?.streak || 0,
          last_quiz_date: state.user.quiz_stats?.last_quiz_date || ''
        },
        login: {
          current_streak: state.user.login_streak?.current || 0,
          highest_streak: state.user.login_streak?.best || 0,
          last_login: state.user.login_streak?.last_login || '',
          streak_maintained: Boolean(state.user.login_streak?.current)
        },
        study: {
          time_today: state.user.study_time || 0,
          time_total: state.user.study_time || 0,
          subject_scores: {
            constitutional: state.user.constitutional_score || 0,
            civil: state.user.civil_score || 0,
            criminal: state.user.criminal_score || 0,
            administrative: state.user.administrative_score || 0
          }
        }
      };

      setStats(newStats);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to calculate stats'));
      setStats(null);
      setLoading(false);
    }
  }, [state.user, state.achievements]);

  useEffect(() => {
    const timer = setTimeout(calculateStats, 100);
    return () => clearTimeout(timer);
  }, [calculateStats]);

  return {
    stats,
    isLoading: loading,
    error,
    refresh: calculateStats
  };
}
