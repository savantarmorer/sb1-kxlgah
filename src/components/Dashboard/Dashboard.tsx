import React from 'react';
import UserProgress from '../UserProgress';
import QuestSystem from '../QuestSystem';
import DailyRewardSystem from '../DailyRewards/DailyRewardSystem';
import { Achievements } from '../RewardSystem/Achievements';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <UserProgress showSettings showRecentGains showMultipliers />
      <QuestSystem />
      <DailyRewardSystem />
      <Achievements />
    </div>
  );
} 