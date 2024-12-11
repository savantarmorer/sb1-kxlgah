import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Medal, Award, Gift } from 'lucide-react';
import Confetti from 'react-confetti';
import { Button } from '../../components/Button';
import { PageContainer } from '../Layout/PageContainer';

/**
 * Displays the results of a completed battle including rewards and XP progress
 * 
 * @param props.score - Battle score data
 * @param props.rewards - Battle rewards including XP and items
 * @param props.stats - Battle statistics
 * @param props.on_continue - Callback for continue button
 * @param props.on_play_again - Callback for play again button
 * 
 * Dependencies:
 * - motion from framer-motion
 * 
 * State Management:
 * - Reads from battle_state for score
 * - Reads from rewards for XP/items
 * 
 * Related Components:
 * - BattleMode: Parent component
 * - XPProgressBar: Child component
 * - ItemReward: Child component
 */
interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
}

interface RewardItem {
  id: string;
  name: string;
  type: string;
  quantity: number;
  rarity: string;
}

interface BattleResultsProps {
  score: {
    player: number;
    opponent: number;
  };
  rewards: {
    xp_earned: number;
    coins_earned: number;
    streak_bonus: number;
    time_bonus?: number;
    items_earned?: RewardItem[];
    achievements_unlocked?: Achievement[];
    level_data?: {
      level: number;
      percentToNextLevel: number;
      next_level_xp: number;
    };
  };
  stats: {
    total_battles: number;
    wins: number;
    losses: number;
    win_streak: number;
  };
  on_continue: () => void;
  on_play_again: () => void;
  is_transitioning: boolean;
  rewards_claimed: boolean;
}

export function BattleResults({
  score,
  rewards,
  stats,
  on_continue,
  on_play_again,
  is_transitioning,
  rewards_claimed
}: BattleResultsProps) {
  const isVictory = score.player > score.opponent;
  
  return (
    <PageContainer>
      <motion.div 
        className="max-w-2xl mx-auto p-6 space-y-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        {/* Victory/Defeat Banner */}
        <motion.div
          className={`text-center ${isVictory ? 'text-green-500' : 'text-red-500'}`}
          initial={{ y: -20 }}
          animate={{ y: 0 }}
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ duration: 0.5, repeat: 3 }}
            className="mb-4"
          >
            <Trophy className="w-20 h-20 mx-auto" />
          </motion.div>
          <motion.h2 
            className="text-3xl font-bold mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {isVictory ? 'Victory!' : 'Defeat'}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl font-semibold"
          >
            {score.player} - {score.opponent}
          </motion.div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Win Streak', value: stats.win_streak, color: 'blue' },
            { label: 'Total Battles', value: stats.total_battles, color: 'purple' },
            { label: 'Win Rate', value: `${Math.round((stats.wins / (stats.wins + stats.losses)) * 100)}%`, color: 'green' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className={`bg-${stat.color}-50 dark:bg-${stat.color}-900/20 p-4 rounded-xl border border-${stat.color}-200 dark:border-${stat.color}-800`}
            >
              <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              <div className={`text-xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Rewards Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-6"
        >
          <h3 className="text-xl font-semibold">Rewards</h3>
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center justify-between">
                <span className="text-blue-600 dark:text-blue-400">XP Earned</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  +{rewards.xp_earned.toLocaleString()}
                </span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800"
            >
              <div className="flex items-center justify-between">
                <span className="text-yellow-600 dark:text-yellow-400">Coins</span>
                <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  +{rewards.coins_earned.toLocaleString()}
                </span>
              </div>
            </motion.div>
          </div>

          {/* XP Progress Bar */}
          {rewards.level_data && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Level {rewards.level_data.level}</span>
                <span>{Math.round(rewards.level_data.percentToNextLevel)}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${rewards.level_data.percentToNextLevel}%` }}
                  transition={{ duration: 1, delay: 1 }}
                  className="h-full bg-indigo-500"
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={on_play_again}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Play Again
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={on_continue}
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Continue
          </motion.button>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
