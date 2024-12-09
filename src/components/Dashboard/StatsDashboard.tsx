import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { use_game } from '../../contexts/GameContext';
import { Achievement } from '../../types/achievements';
import {
  Trophy,
  Calendar,
  Brain,
  Swords,
  Target,
  Award,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import LevelProgress from '../LevelSystem/LevelProgress';
import { supabase } from '../../lib/supabase';
import { useStudyTime } from '../../hooks/useStudyTime';
import { useDailyRewards } from '../../hooks/useDailyRewards';

interface StatCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, icon, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <div className="text-indigo-500 dark:text-indigo-400">{icon}</div>
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</h3>
    </div>
    {children}
  </div>
);

interface StudyTime {
  today: number;
  total: number;
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string | null;
  achievements: Achievement;
}

/**
 * StatsDashboard Component
 * Comprehensive view of user progress and performance metrics
 * 
 * Database Dependencies:
 * - achievements: Achievement definitions
 * - user_achievements: User progress
 * - battle_stats: Combat metrics
 * - daily_rewards: Reward system
 * - quiz_user_stats: Quiz performance
 * - user_logins: Engagement tracking
 */
export default function StatsDashboard() {
  const { state } = use_game();
  const studyTime = useStudyTime() as unknown as StudyTime;
  const { dailyRewards, checkDailyReward } = useDailyRewards();
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);

  useEffect(() => {
    async function fetchAchievements() {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements(*)
        `)
        .eq('user_id', state.user.id);

      if (!error && data) {
        setUserAchievements(data);
      }
    }

    fetchAchievements();
  }, [state.user.id]);

  // Transform achievements for display with proper typing
  const unlockedAchievements = userAchievements
    .filter(ua => ua.unlocked_at)
    .map(ua => ua.achievements);

  const {
    battle_stats = {
      total_battles: 0,
      wins: 0,
      losses: 0,
      win_streak: 0,
      highest_streak: 0,
      total_xp_earned: 0,
      total_coins_earned: 0
    },
    quiz_stats = {
      total_questions: 0,
      correct_answers: 0,
      accuracy: 0,
      average_time: 0,
      completed_quizzes: 0,
      streak: 0
    },
    login_streak = {
      current: 0,
      best: 0,
      last_login: new Date().toISOString()
    }
  } = state.user;

  // Achievement Stats
  const achievements = userAchievements?.map(ua => ua.achievements) || [];

  // Battle Stats
  const winRate = battle_stats.total_battles
    ? ((battle_stats.wins / battle_stats.total_battles) * 100).toFixed(1)
    : '0.0';

  // Achievement Stats
  const totalAchievements = achievements.length;
  const achievementRate = totalAchievements
    ? Math.min(100, Math.max(0, Number(((unlockedAchievements.length / totalAchievements) * 100).toFixed(1)) || 0))
    : 0;

  // Quiz Stats
  const accuracy = quiz_stats.total_questions
    ? ((quiz_stats.correct_answers / quiz_stats.total_questions) * 100).toFixed(1)
    : '0.0';

  // Replace study_time with studyTime from hook
  const timeToday = Math.round((studyTime?.today || 0) / 60);
  const timeTotal = Math.round((studyTime?.total || 0) / 3600);

  // Use dailyRewards instead of state.user.daily_rewards
  const {
    streak_multiplier = 1,
    next_reward = { reward_value: 0, reward_type: 'coins' }
  } = dailyRewards || {};

  // Add useEffect to check daily rewards
  useEffect(() => {
    checkDailyReward();
  }, [checkDailyReward]);

  return (
    <div className="space-y-6 p-4">
      {/* Level Progress Section */}
      <section>
        <LevelProgress
          showDetails={true}
          showRecentGains={true}
          showMultipliers={true}
          showSubjectProgress={true}
        />
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Battle Performance */}
        <motion.div
          key="battle-performance"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Battle Performance
              </p>
              <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {battle_stats.total_battles || 0}
              </p>
            </div>
            <div className="rounded-full p-3 bg-gray-50 dark:bg-gray-700">
              <Swords size={20} />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`flex items-center gap-1 text-sm ${
                  parseFloat(winRate) >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {parseFloat(winRate) >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{Math.abs(parseFloat(winRate))}%</span>
              </motion.div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                vs last period
              </span>
            </div>
          </div>

          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2 }}
          />
        </motion.div>

        {/* Achievements */}
        <motion.div
          key="achievements"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Achievements
              </p>
              <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {unlockedAchievements.length}/{totalAchievements}
              </p>
            </div>
            <div className="rounded-full p-3 bg-gray-50 dark:bg-gray-700">
              <Trophy size={20} />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`flex items-center gap-1 text-sm ${
                  parseFloat(achievementRate) >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {parseFloat(achievementRate) >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{Math.abs(parseFloat(achievementRate))}%</span>
              </motion.div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                vs last period
              </span>
            </div>
          </div>

          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4 }}
          />
        </motion.div>

        {/* Quiz Performance */}
        <motion.div
          key="quiz-performance"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Quiz Performance
              </p>
              <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {quiz_stats.total_questions || 0}
              </p>
            </div>
            <div className="rounded-full p-3 bg-gray-50 dark:bg-gray-700">
              <Brain size={20} />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`flex items-center gap-1 text-sm ${
                  parseFloat(accuracy) >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {parseFloat(accuracy) >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{Math.abs(parseFloat(accuracy))}%</span>
              </motion.div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                vs last period
              </span>
            </div>
          </div>

          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6 }}
          />
        </motion.div>

        {/* Login Streak */}
        <motion.div
          key="login-streak"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Study Consistency
              </p>
              <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {login_streak.current || 0} days
              </p>
            </div>
            <div className="rounded-full p-3 bg-gray-50 dark:bg-gray-700">
              <Calendar size={20} />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`flex items-center gap-1 text-sm ${
                  parseFloat(login_streak.best) >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {parseFloat(login_streak.best) >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{Math.abs(parseFloat(login_streak.best))}</span>
              </motion.div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                vs last period
              </span>
            </div>
          </div>

          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8 }}
          />
        </motion.div>

        {/* Daily Rewards */}
        <motion.div
          key="daily-rewards"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Daily Rewards
              </p>
              <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {next_reward.reward_value} {next_reward.reward_type}
              </p>
            </div>
            <div className="rounded-full p-3 bg-gray-50 dark:bg-gray-700">
              <Target size={20} />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`flex items-center gap-1 text-sm ${
                  parseFloat(streak_multiplier) >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {parseFloat(streak_multiplier) >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{Math.abs(parseFloat(streak_multiplier))}x</span>
              </motion.div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                vs last period
              </span>
            </div>
          </div>

          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.9 }}
          />
        </motion.div>

        {/* Study Time */}
        <motion.div
          key="study-time"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Study Time
              </p>
              <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {timeToday} min
              </p>
            </div>
            <div className="rounded-full p-3 bg-gray-50 dark:bg-gray-700">
              <Clock size={20} />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`flex items-center gap-1 text-sm ${
                  parseFloat(timeTotal) >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {parseFloat(timeTotal) >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{Math.abs(parseFloat(timeTotal))}</span>
              </motion.div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                vs last period
              </span>
            </div>
          </div>

          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1 }}
          />
        </motion.div>
      </div>
    </div>
  );
}
