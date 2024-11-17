import { motion } from 'framer-motion';
import { Star, Trophy, Zap } from 'lucide-react';
import { useLevelSystem } from '../../hooks/useLevelSystem';

/**
 * LevelProgress Component
 * 
 * Displays the user's current level, XP progress, and progress to next level
 * Used in: UserProfile, Dashboard
 * Depends on: useLevelSystem hook, GameContext (indirectly)
 */
export function LevelProgress() {
  // Get level data from the hook
  const { 
    currentLevel,
    currentXP,
    progress,
    xpToNextLevel
  } = useLevelSystem();

  return (
    <div className="card">
      {/* Level Header Section
       * Shows current level and total XP
       * Updates whenever XP changes via GameContext
       */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Trophy className="text-yellow-500" size={24} />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Level {currentLevel}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentXP.toLocaleString()} XP Total
            </p>
          </div>
        </div>

        {/* XP Remaining Display
         * Shows XP needed for next level
         * Updates based on current progress
         */}
        <div className="flex items-center space-x-2">
          <Zap className="text-indigo-500" size={16} />
          <span className="font-medium text-indigo-600 dark:text-indigo-400">
            {xpToNextLevel.toLocaleString()} XP to next level
          </span>
        </div>
      </div>

      {/* Progress Bar Section
       * Visual representation of level progress
       * Animated using Framer Motion
       */}
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <Star className="text-yellow-500" size={16} />
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold inline-block text-indigo-600 dark:text-indigo-400">
              {Math.floor(progress)}%
            </span>
          </div>
        </div>

        {/* Animated Progress Bar
         * Uses Framer Motion for smooth transitions
         * Progress calculated by useLevelSystem hook
         * Updates whenever XP changes
         */}
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-200 dark:bg-gray-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Component Dependencies:
 * - useLevelSystem: Provides all level and XP calculations
 * - GameContext: Source of XP and level data
 * - Framer Motion: Handles progress bar animations
 * 
 * Used By:
 * - UserProfile component
 * - Dashboard component
 * - Achievement system (for level-based achievements)
 * 
 * Updates:
 * - On XP gain
 * - On level up
 * - When progress changes
 * 
 * Role in System:
 * - Visual representation of user progress
 * - Progress tracking for level-based achievements
 * - Part of the core progression system
 */ 