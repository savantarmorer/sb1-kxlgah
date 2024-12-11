import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface XPBarProps {
  level: number;
  currentXP: number;
  nextLevelXP: number;
}

export function XPBar({ level, currentXP, nextLevelXP }: XPBarProps) {
  const progress = (currentXP / nextLevelXP) * 100;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 180 }}
            transition={{ duration: 0.3 }}
            className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg"
          >
            <Star className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Level {level}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Next Level
          </span>
          <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
            {Math.round(progress)}%
          </p>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="relative h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500"
        />
        <div className="absolute top-0 left-0 w-full h-full bg-black/5 dark:bg-white/5" />
      </div>

      {/* XP Multiplier */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          XP Multiplier: 1x
        </span>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full"
        >
          <span className="text-green-600 dark:text-green-400 font-medium">
            +{Math.round((nextLevelXP - currentXP)).toLocaleString()} XP to next level
          </span>
        </motion.div>
      </div>
    </div>
  );
} 