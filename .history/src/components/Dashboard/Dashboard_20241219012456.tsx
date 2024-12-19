import React from 'react';
import UserProgress from '../UserProgress';
import QuestSystem from '../QuestSystem';
import DailyRewardSystem from '../DailyRewards/DailyRewardSystem';
import { AchievementList } from '../Achievements/AchievementList';
import { useAchievements } from '../../hooks/useAchievements';
import { useGame } from '../../contexts/GameContext';

export default function Dashboard() {
  const { state } = useGame();
  const { achievements } = useAchievements();

  // Return early if user is not loaded
  if (!state.user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserProgress showSettings showRecentGains showMultipliers />
      <QuestSystem />
      <DailyRewardSystem />
      <AchievementList achievements={achievements} showFilters={false} maxDisplay={5} />
    </div>
  );
} 