import React, { useState } from 'react';
import Navigation from './Navigation';
import UserProgress from './UserProgress';
import QuestSystem from './QuestSystem';
import Leaderboard from './Leaderboard';
import Store from './Store';
import { useGame } from '../contexts/GameContext';
import { Achievements } from './RewardSystem/Achievements';
import DailyRewardSystem from './DailyRewards/DailyRewardSystem';
import ProfileDashboard from './UserProfile/ProfileDashboard';
import Inventory from './UserProfile/Inventory';
import { BattleMode } from './Battle';
import AdminDashboard from './admin/AdminDashboard';
import { View } from '../types/navigation';

export default function AppContent() {
  const [currentView, setCurrentView] = useState<View>('home');
  const { state } = useGame();
  const isAdmin = state.user.roles?.includes('admin');

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="space-y-6">
            <DailyRewardSystem />
            <QuestSystem />
          </div>
        );
      case 'leaderboard':
        return <Leaderboard />;
      case 'quests':
        return <QuestSystem />;
      case 'store':
        return <Store />;
      case 'profile':
        return <ProfileDashboard />;
      case 'inventory':
        return <Inventory />;
      case 'admin':
        return isAdmin ? <AdminDashboard onClose={() => setCurrentView('home')} /> : null;
      case 'battle':
        return <BattleMode onClose={() => setCurrentView('home')} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {/* Header - Always show UserProgress */}
      <header className="app-header">
        <div className="content-container">
          <UserProgress showSettings={currentView === 'home'} />
        </div>
      </header>

      {/* Main Content */}
      <main className="app-content">
        <div className="content-container">
          {renderContent()}
        </div>
      </main>

      {/* Navigation */}
      <Navigation
        currentView={currentView}
        onViewChange={setCurrentView}
        showInventory={state.user.roles?.includes('premium')}
        isAdmin={isAdmin}
      />
    </div>
  );
}