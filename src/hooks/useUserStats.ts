import { useEffect, useState, useCallback } from 'react';
import { use_game } from '../contexts/GameContext';
import { DBbattle_stats as battle_stats } from '../types/battle';
import { Achievement } from '../types/achievements';
import { DailyReward } from '../types/rewards';

interface QuizStats {
  total_questions: number;
  correct_answers: number;
  average_time: number;
  streak: number;
  accuracy: number;
  last_quiz_date: string;
}

interface DBQuizStats {
  total_questions: number;
  correct_answers: number;
  average_time: number;
  streak: number;
  last_quiz_date: string;
}

interface DailyRewardState {
  day: number;
  reward_type: string;
  reward_value: number;
  rarity: string;
}

interface UserStats {
  battle: Omit<battle_stats, 'user_id' | 'updated_at'> & { win_rate: number };
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
  rewards: {
    next_reward: DailyRewardState;
    streak_multiplier: number;
    last_claim: string;
  };
  study: {
    time_today: number;
    time_total: number;
    subject_scores: {
      constitutional: number;
      civil: number;
      criminal: number;
      administrative: number;
    };
  };
}

interface StudyTime {
  today: number;
  total: number;
}

const DEFAULT_STATS: UserStats = {
  battle: {
    total_battles: 0,
    wins: 0,
    losses: 0,
    win_streak: 0,
    highest_streak: 0,
    total_xp_earned: 0,
    total_coins_earned: 0,
    win_rate: 0,
    difficulty: 1
  },
  achievements: {
    total: 0,
    unlocked: 0,
    progress: 0,
    recent: [],
  },
  quiz: {
    total_questions: 0,
    correct_answers: 0,
    average_time: 0,
    streak: 0,
    accuracy: 0,
    last_quiz_date: '',
  },
  login: {
    current_streak: 0,
    highest_streak: 0,
    last_login: '',
    streak_maintained: false,
  },
  rewards: {
    next_reward: {
      day: 1,
      reward_type: 'coins',
      reward_value: 0,
      rarity: 'common'
    },
    streak_multiplier: 1,
    last_claim: ''
  },
  study: {
    time_today: 0,
    time_total: 0,
    subject_scores: {
      constitutional: 0,
      civil: 0,
      criminal: 0,
      administrative: 0,
    },
  },
};

/**
 * Custom hook for managing user statistics with real-time updates
 * 
 * Features:
 * - Real-time stat updates
 * - Default values for all stats
 * - Optimistic updates
 * - Debounced calculations
 * - Error handling
 */
export function useUserStats() {
  const { state } = use_game();
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Debounced stat calculation
  const calculateStats = useCallback(() => {
    try {
      if (!state.user) {
        setStats(DEFAULT_STATS);
        setIsLoading(false);
        return;
      }

      // Battle Stats
      const battle_stats: battle_stats = state.user.battle_stats || {
        user_id: '',
        updated_at: '',
        total_battles: 0,
        wins: 0,
        losses: 0,
        win_streak: 0,
        highest_streak: 0,
        total_xp_earned: 0,
        total_coins_earned: 0,
        difficulty: 1
      };
      const totalBattles = battle_stats.total_battles || 0;
      const wins = battle_stats.wins || 0;

      // Achievement Stats
      const achievements = state.user.achievements || [];
      const unlockedAchievements = achievements.filter(a => a.unlocked);

      // Quiz Stats
      const quizStats = (state.user.quiz_stats || {}) as DBQuizStats;
      const totalQuestions = quizStats.total_questions || 0;
      const correctAnswers = quizStats.correct_answers || 0;

      const study_time = (state.user.study_time || { today: 0, total: 0 }) as StudyTime;

      const newStats: UserStats = {
        battle: {
          total_battles: totalBattles,
          wins,
          losses: battle_stats.losses || 0,
          win_streak: battle_stats.win_streak || 0,
          highest_streak: battle_stats.highest_streak || 0,
          total_xp_earned: battle_stats.total_xp_earned || 0,
          total_coins_earned: battle_stats.total_coins_earned || 0,
          win_rate: totalBattles ? (wins / totalBattles) * 100 : 0,
          difficulty: battle_stats.difficulty || 1
        },
        achievements: {
          total: achievements.length,
          unlocked: unlockedAchievements.length,
          progress: achievements.length
            ? (unlockedAchievements.length / achievements.length) * 100
            : 0,
          recent: unlockedAchievements
            .sort((a, b) => {
              const dateA = a.unlocked_at ? new Date(a.unlocked_at).getTime() : 0;
              const dateB = b.unlocked_at ? new Date(b.unlocked_at).getTime() : 0;
              return dateB - dateA;
            })
            .slice(0, 5),
        },
        quiz: {
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          average_time: quizStats.average_time || 0,
          streak: quizStats.streak || 0,
          accuracy: totalQuestions ? (correctAnswers / totalQuestions) * 100 : 0,
          last_quiz_date: quizStats.last_quiz_date || '',
        },
        login: {
          current_streak: state.user.login_streak?.current || 0,
          highest_streak: state.user.login_streak?.best || 0,
          last_login: state.user.login_streak?.last_login || '',
          streak_maintained: Boolean(state.user.login_streak?.current),
        },
        rewards: {
          next_reward: {
            day: state.user.daily_rewards?.next_reward?.day ?? DEFAULT_STATS.rewards.next_reward.day,
            reward_type: state.user.daily_rewards?.next_reward?.reward_type ?? DEFAULT_STATS.rewards.next_reward.reward_type,
            reward_value: state.user.daily_rewards?.next_reward?.reward_value ?? DEFAULT_STATS.rewards.next_reward.reward_value,
            rarity: state.user.daily_rewards?.next_reward?.rarity ?? DEFAULT_STATS.rewards.next_reward.rarity
          },
          streak_multiplier: state.user.daily_rewards?.streak_multiplier || 1,
          last_claim: state.user.daily_rewards?.claimed_today ? new Date().toISOString() : ''
        },
        study: {
          time_today: study_time.today,
          time_total: study_time.total,
          subject_scores: {
            constitutional: state.user.constitutionalScore || 0,
            civil: state.user.civilScore || 0,
            criminal: state.user.criminalScore || 0,
            administrative: state.user.administrativeScore || 0,
          },
        },
      };

      setStats(newStats);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to calculate stats'));
      setStats(DEFAULT_STATS);
      setIsLoading(false);
    }
  }, [state.user]);

  // Debounce stat updates
  useEffect(() => {
    const timer = setTimeout(calculateStats, 100);
    return () => clearTimeout(timer);
  }, [calculateStats]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (state.user?.id) {
      // Stats are automatically updated through GameContext
      // which handles the WebSocket connections
      setIsLoading(false);
    }
  }, [state.user?.id]);

  return {
    stats,
    isLoading,
    error,
    refresh: calculateStats,
  };
}
