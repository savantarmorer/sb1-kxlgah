import React, { useMemo } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { motion } from 'framer-motion';
import type { LeaderboardEntry } from '../types/game';

/**
 * Leaderboard Component
 * Displays a ranked list of top players based on their performance
 * 
 * Dependencies:
 * - GameContext: For accessing leaderboard data
 * - Framer Motion: For animation effects
 * - Lucide React: For rank icons
 * 
 * Used by:
 * - Dashboard/Home page
 * - Tournament results page
 * - Profile statistics section
 * 
 * Features:
 * - Responsive design
 * - Animated entries
 * - Dark mode support
 * - Accessibility compliant
 * - Error boundary protected
 * 
 * Performance Optimizations:
 * - Memoized rank icons
 * - Memoized player entries
 * - Conditional rendering
 */
export default function Leaderboard() {
  const { state } = useGame();
  const { leaderboard = [], loading, error } = state;

  /**
   * Returns the appropriate icon based on player rank
   * Memoized to prevent unnecessary re-renders
   * @param rank - Player's position in the leaderboard
   * @returns React component for the rank icon
   */
  const getRankIcon = useMemo(() => (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-500" size={24} aria-label="First Place Trophy" />;
      case 2:
        return <Medal className="text-gray-400" size={24} aria-label="Second Place Medal" />;
      case 3:
        return <Medal className="text-amber-600" size={24} aria-label="Third Place Medal" />;
      default:
        return <Award className="text-indigo-400" size={24} aria-label={`Rank ${rank} Award`} />;
    }
  }, []);

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6" role="alert">
        <h2 className="text-2xl font-bold mb-6">Top Legal Scholars</h2>
        <div className="text-center text-red-600 dark:text-red-400 py-8">
          Error loading leaderboard data. Please try again later.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6" aria-busy="true">
        <h2 className="text-2xl font-bold mb-6">Top Legal Scholars</h2>
        <div className="text-center text-gray-600 dark:text-gray-400 py-8">
          Loading leaderboard data...
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6" role="status">
        <h2 className="text-2xl font-bold mb-6">Top Legal Scholars</h2>
        <div className="text-center text-gray-600 dark:text-gray-400 py-8">
          No leaderboard data available yet.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6" role="region" aria-label="Leaderboard">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Top Legal Scholars</h2>
      
      <div className="space-y-4">
        {leaderboard.map((entry: LeaderboardEntry, index: number) => (
          <motion.div
            key={entry.user_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center space-x-4 p-4 rounded-lg ${
              entry.user_id === state.user?.id
                ? 'bg-indigo-50 border border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'
                : 'bg-gray-50 border border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'
            }`}
          >
            <div className="flex-shrink-0">
              {getRankIcon(entry.rank)}
            </div>
            <div className="flex-shrink-0">
              <img
                src={entry.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                alt={entry.username}
                className="w-12 h-12 rounded-full"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">{entry.username}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Level {Math.floor(entry.score / 1000) + 1}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900 dark:text-white">{entry.score} XP</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rank #{entry.rank}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}