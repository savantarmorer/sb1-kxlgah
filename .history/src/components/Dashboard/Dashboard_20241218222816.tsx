import React from 'react';
import UserProgress from '../UserProgress';
import QuestSystem from '../QuestSystem';
import DailyRewardSystem from '../DailyRewards/DailyRewardSystem';
import { AchievementList } from '../Achievements/AchievementList';
import { useAchievements } from '../../hooks/useAchievements';

export default function Dashboard() {
  const { achievements } = useAchievements();

  return (
    <div className="space-y-6">
      <UserProgress showSettings showRecentGains showMultipliers />
      <QuestSystem />
      <DailyRewardSystem />
      <AchievementList achievements={achievements} showFilters={false} maxDisplay={5} />
    </div>
  );
} 