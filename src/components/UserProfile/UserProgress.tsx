import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Star } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { LevelSystem } from '../../lib/levelSystem';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

// Animated number component
const AnimatedNumber = ({ value }: { value: number }) => {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="inline-block"
    >
      {value.toLocaleString()}
    </motion.span>
  );
};

export default function UserProgress() {
  const { state, dispatch } = useGame();
  const [showGainAnimation, setShowGainAnimation] = useState(false);
  const [recentGain, setRecentGain] = useState({ xp: 0, coins: 0 });
  const { level, xp, coins } = state.user;
  
  const current_level_total_xp = LevelSystem.calculate_total_xp_for_level(level);
  const xp_in_current_level = xp - current_level_total_xp;
  const xp_needed_for_next_level = LevelSystem.calculate_xp_for_level(level);
  const progress = Math.min(100, Math.floor((xp_in_current_level / xp_needed_for_next_level) * 100));

  useEffect(() => {
    // Subscribe to real-time updates for the user's profile
    const userSubscription = supabase
      .channel('user_stats_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${state.user.id}`,
        },
        (payload) => {
          const newData = payload.new;
          
          // Calculate gains
          const xpGain = newData.xp - state.user.xp;
          const coinsGain = newData.coins - state.user.coins;
          
          if (xpGain > 0 || coinsGain > 0) {
            setRecentGain({ xp: xpGain, coins: coinsGain });
            setShowGainAnimation(true);
            
            // Hide gain animation after 2 seconds
            setTimeout(() => setShowGainAnimation(false), 2000);
          }
          
          // Update game state with new values
          dispatch({
            type: 'UPDATE_USER',
            payload: newData
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userSubscription);
    };
  }, [state.user.id, dispatch]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="space-y-6">
        {/* Level and XP */}
        <div className="relative">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Level <AnimatedNumber value={level} />
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <AnimatedNumber value={xp_in_current_level} /> / <AnimatedNumber value={xp_needed_for_next_level} /> XP
          </p>
          <AnimatePresence>
            {showGainAnimation && recentGain.xp > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: -20 }}
                exit={{ opacity: 0 }}
                className="absolute -top-2 right-0 text-green-500 font-bold"
              >
                +{recentGain.xp} XP
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mt-2 relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 50 }}
              className="absolute inset-y-0 left-0 bg-indigo-600 rounded-full"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg relative">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Coins
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              <AnimatedNumber value={coins} />
            </p>
            <AnimatePresence>
              {showGainAnimation && recentGain.coins > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: -20 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-2 right-2 text-green-500 font-bold"
                >
                  +{recentGain.coins}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Battle Rating
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              <AnimatedNumber value={state.user.battle_rating || 0} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}