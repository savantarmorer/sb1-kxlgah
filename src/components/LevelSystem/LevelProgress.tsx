import React from 'react';
import { motion } from 'framer-motion';
import { useLevelSystem } from '../../hooks/useLevelSystem';
import { use_game } from '../../contexts/GameContext';

interface SubjectScore {
  subject: string;
  score: number;
}

interface LevelProgressProps {
  /** Show detailed XP information */
  showDetails?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Show recent XP gains */
  showRecentGains?: boolean;
  /** Show multipliers */
  showMultipliers?: boolean;
  /** Show subject-specific progress */
  showSubjectProgress?: boolean;
}

/**
 * LevelProgress Component
 * Displays user's level progress with an animated progress bar
 * 
 * Database Dependencies:
 * - user_progress: Core XP and level data
 *   - xp: Current XP total
 *   - level: Current level
 *   - recent_xp_gains: Recent XP history
 *   - reward_multipliers: Active XP multipliers
 * - battle_stats: Battle-related progress
 *   - total_xp_earned: XP from battles
 * - profiles: User profile data
 *   - level: User level
 *   - xp: Total XP
 *   - constitutional_score: Constitutional law score
 *   - civil_score: Civil law score
 *   - criminal_score: Criminal law score
 *   - administrative_score: Administrative law score
 * - subject_scores: Subject-specific progress
 *   - subject: Area of law
 *   - score: Performance score
 */
export default function LevelProgress({
  showDetails = true,
  className = '',
  showRecentGains = false,
  showMultipliers = false,
  showSubjectProgress = false
}: LevelProgressProps) {
  const { current_level, progress, xp_to_next_level } = useLevelSystem();
  const { state } = use_game();

  // Get recent XP gains from user_progress table data
  const recentGains = state.user.recent_xp_gains || [];
  const multipliers = state.user.reward_multipliers || {};

  // Get subject scores from profiles table
  const subjectScores: SubjectScore[] = [
    { subject: 'Constitutional', score: state.user.constitutional_score },
    { subject: 'Civil', score: state.user.civil_score },
    { subject: 'Criminal', score: state.user.criminal_score },
    { subject: 'Administrative', score: state.user.administrative_score }
  ].filter(score => score.score !== undefined);

  return (
    <div className={`space-y-2 ${className}`}>
      {showDetails && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium dark:text-gray-200">
            Level {current_level}
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {xp_to_next_level} XP to next level
          </span>
        </div>
      )}
      
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-indigo-500 dark:bg-indigo-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {showRecentGains && recentGains.length > 0 && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Recent: {recentGains.map((gain: { amount: number }) => `+${gain.amount} XP`).join(', ')}
        </div>
      )}

      {showMultipliers && Object.keys(multipliers).length > 0 && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Active Multipliers: 
          {Object.entries(multipliers).map(([key, value]) => (
            <span key={key} className="ml-1">
              {key}: {value}x
            </span>
          ))}
        </div>
      )}

      {showSubjectProgress && subjectScores.length > 0 && (
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
                  initial={{ width: 0 }}
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

/**
 * Component Documentation
 * 
 * Database Schema Integration:
 * - user_progress:
 *   - xp: Current experience points
 *   - level: Current user level
 *   - recent_xp_gains: Array of recent XP gains
 *   - reward_multipliers: Active multipliers
 * - profiles:
 *   - Subject-specific scores
 *   - Overall progress metrics
 * - subject_scores:
 *   - Individual subject progress
 *   - Historical performance data
 * 
 * Props:
 * @prop {boolean} showDetails - Toggle level and XP information
 * @prop {string} className - Additional CSS classes
 * @prop {boolean} showRecentGains - Show recent XP gains
 * @prop {boolean} showMultipliers - Show active multipliers
 * @prop {boolean} showSubjectProgress - Show subject-specific progress bars
 * 
 * State Management:
 * - Uses useLevelSystem hook for calculations
 * - Reads from GameContext for user data
 * 
 * Database Updates:
 * - Read-only component
 * - Updates reflected through GameContext
 * 
 * Related Tables:
 * - battle_stats: XP from battles
 * - profiles: User level info
 * - user_progress: Core progress data
 * - subject_scores: Subject performance
 */
