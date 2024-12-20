import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../contexts/GameContext';
import { User, XPGain } from '../../types/user';
import { useLevelSystem } from '../../hooks/useLevelSystem';

interface SubjectScore {
  subject: string;
  score: number;
}

interface LevelProgressProps {
  isStatic?: boolean;
}

export function LevelProgress({
  isStatic = true
}: LevelProgressProps) {
  const { current_level, progress, xp_to_next_level } = useLevelSystem();
  const { state } = useGame();

  // Get recent XP gains from game state
  const recentGains = state.recentXPGains || [];
  const multipliers = state.user?.rewardMultipliers || { xp: 1, coins: 1 };

  // Get subject scores from profiles table
  const subjectScores: SubjectScore[] = [
    { subject: 'Constitutional', score: state.user?.constitutional_score || 0 },
    { subject: 'Civil', score: state.user?.civil_score || 0 },
    { subject: 'Criminal', score: state.user?.criminal_score || 0 },
    { subject: 'Administrative', score: state.user?.administrative_score || 0 }
  ].filter(score => score.score > 0);

  return (
    <div className={`space-y-2`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium dark:text-gray-200">
          Level {current_level}
        </span>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {xp_to_next_level} XP to next level
        </span>
      </div>
      
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-indigo-500 dark:bg-indigo-600"
          initial={isStatic ? { width: `${progress}%` } : { width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {recentGains.length > 0 && !isStatic && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Recent: {recentGains.map((gain, index) => (
            <span key={gain.timestamp}>
              {index > 0 ? ', ' : ''}+{gain.amount} XP
            </span>
          ))}
        </div>
      )}

      {Object.keys(multipliers).length > 0 && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Active Multipliers: 
          {Object.entries(multipliers).map(([key, value], index) => (
            <span key={key} className="ml-1">
              {index > 0 ? ', ' : ''}{key}: {value}x
            </span>
          ))}
        </div>
      )}

      {subjectScores.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium dark:text-gray-200">Subject Progress</h4>
          {subjectScores.map(({ subject, score }) => (
            <div key={subject} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">{subject}</span>
                <span className="text-gray-600 dark:text-gray-400">{score}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-indigo-500 dark:bg-indigo-600"
                  initial={isStatic ? { width: `${score}%` } : { width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
