import { motion } from 'framer-motion';
import { TrendingUp, Star } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { LevelSystem } from '../../lib/levelSystem';

export default function UserProgress() {
  const { state } = useGame();
  const { level, xp, coins } = state.user;
  
  const current_level_total_xp = LevelSystem.calculate_total_xp_for_level(level);
  const xp_in_current_level = xp - current_level_total_xp;
  const xp_needed_for_next_level = LevelSystem.calculate_xp_for_level(level);
  const progress = Math.min(100, Math.floor((xp_in_current_level / xp_needed_for_next_level) * 100));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="space-y-6">
        {/* Level and XP */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Level {level}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {xp_in_current_level.toLocaleString()} / {xp_needed_for_next_level.toLocaleString()} XP
          </p>
          <div className="mt-2 relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="absolute inset-y-0 left-0 bg-indigo-600 rounded-full"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Coins
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {coins.toLocaleString()}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Battle Rating
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {state.user.battle_rating || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}