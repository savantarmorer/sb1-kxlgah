import React from 'react';
import UserProgress from '../UserProgress';
import QuestSystem from '../QuestSystem';
import DailyRewardSystem from '../DailyRewards/DailyRewardSystem';
import { AchievementList } from '../Achievements/AchievementList';
import { useAchievements } from '../../hooks/useAchievements';
import { useGame } from '../../contexts/GameContext';
import { useAuth } from '../../hooks/useAuth';

export default function Dashboard() {
  const { state } = useGame();
  const { isLoading: isAuthLoading, error: authError } = useAuth();
  const { achievements } = useAchievements();

  if (isAuthLoading || !state.user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Error loading dashboard: {authError.message}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <UserProgress />
      <QuestSystem />
      <DailyRewardSystem />
      <AchievementList achievements={achievements} />
    </div>
  );
} 