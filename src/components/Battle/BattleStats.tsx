import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Target, TrendingUp, Medal, Swords, Award, Crown } from 'lucide-react';
import { use_game } from '../../contexts/GameContext';

export default function battle_stats() {
  const { state } = use_game();
  const stats = state.battle_stats;

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        No battle statistics available yet.
      </div>
    );
  }

  const calculateWinRate = useMemo(() => {
    if (!stats.total_battles) return 0;
    return ((stats.wins / stats.total_battles) * 100).toFixed(1);
  }, [stats.total_battles, stats.wins]);

  const getRankInfo = (rating: number): { title: string; color: string; icon: JSX.Element } => {
    if (rating >= 2000) return { 
      title: 'Grandmaster', 
      color: 'text-yellow-500',
      icon: <Crown className="h-8 w-8" />
    };
    if (rating >= 1800) return { 
      title: 'Master', 
      color: 'text-purple-500',
      icon: <Award className="h-8 w-8" />
    };
    if (rating >= 1600) return { 
      title: 'Expert', 
      color: 'text-blue-500',
      icon: <Star className="h-8 w-8" />
    };
    if (rating >= 1400) return { 
      title: 'Veteran', 
      color: 'text-green-500',
      icon: <Medal className="h-8 w-8" />
    };
    if (rating >= 1200) return { 
      title: 'Skilled', 
      color: 'text-indigo-500',
      icon: <Target className="h-8 w-8" />
    };
    return { 
      title: 'Novice', 
      color: 'text-gray-500',
      icon: <Swords className="h-8 w-8" />
    };
  };

  const rankInfo = getRankInfo(state.user.battle_rating || 0);

  const derived_stats = useMemo(() => {
    const total_battles = stats.total_battles || 0;
    const wins = stats.wins || 0;
    const losses = stats.losses || 0;
    
    return {
      win_rate: calculateWinRate,
      average_score: total_battles > 0 ? (stats.total_xp_earned / total_battles) : 0,
      current_streak: stats.win_streak || 0,
      total_matches: total_battles,
      win_loss_ratio: losses > 0 ? wins / losses : wins
    };
  }, [stats, calculateWinRate]);

  return (
    <div className="space-y-8">
      {/* Rank Display */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-gray-400 text-sm uppercase tracking-wider">Current Rank</h2>
            <div className="flex items-center space-x-3">
              <span className={`${rankInfo.color}`}>
                {rankInfo.icon}
              </span>
              <div>
                <p className={`text-3xl font-bold ${rankInfo.color}`}>
                  {rankInfo.title}
                </p>
                <p className="text-gray-400">
                  Rating: {state.user.battle_rating || 0}
                </p>
              </div>
            </div>
          </div>
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              times: [0, 0.5, 1],
              repeat: Infinity,
              repeatDelay: 1
            }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full blur-lg opacity-50"></div>
            <Trophy className="h-12 w-12 text-yellow-400" />
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Win Rate</p>
              <p className="text-2xl font-bold">{derived_stats.win_rate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Current Streak</p>
              <p className="text-2xl font-bold">{derived_stats.current_streak}</p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total Matches</p>
              <p className="text-2xl font-bold">{derived_stats.total_matches}</p>
            </div>
            <Swords className="h-8 w-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">W/L Ratio</p>
              <p className="text-2xl font-bold">{derived_stats.win_loss_ratio.toFixed(2)}</p>
            </div>
            <Medal className="h-8 w-8 text-purple-500" />
          </div>
        </motion.div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Star className="text-orange-500 h-5 w-5" />
            <span>Performance</span>
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Average Score</span>
                <span className="font-medium">{derived_stats.average_score.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(derived_stats.average_score, 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-orange-500 rounded-full"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Win Rate</span>
                <span className="font-medium">{derived_stats.win_rate}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${derived_stats.win_rate}%` }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="h-full bg-green-500 rounded-full"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Current Streak</span>
                <span className="font-medium">{derived_stats.current_streak}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(derived_stats.current_streak / 10) * 100}%` }}
                  transition={{ duration: 1, delay: 0.7 }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <TrendingUp className="text-green-500 h-5 w-5" />
            <span>Progress</span>
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total XP</span>
              <motion.span 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="font-medium"
              >
                {stats.total_xp_earned?.toLocaleString() || '0'}
              </motion.span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Coins</span>
              <motion.span 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="font-medium"
              >
                {stats.total_coins_earned?.toLocaleString() || '0'}
              </motion.span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Last Battle</span>
              <span className="text-sm text-gray-500">
                {stats.last_battle_date ? new Date(stats.last_battle_date).toLocaleDateString() : 'Never'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}