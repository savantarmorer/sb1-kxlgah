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
import { BattleMode } from './Battle/';
import AdminDashboard from './admin/AdminDashboard';
import { Swords } from 'lucide-react';
import Button from './Button';
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {state.user.name}!
              </h2>
              <Button
                onClick={() => setCurrentView('battle')}
                variant="primary"
                className="flex items-center space-x-2"
              >
                <Swords size={20} />
                <span>Battle Mode</span>
              </Button>
            </div>

            {state.battleStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card">
                  <h3 className="text-lg font-semibold mb-2">Battle Record</h3>
                  <p className="text-2xl font-bold text-brand-teal-600">
                    {state.battleStats.wins}W - {state.battleStats.losses}L
                  </p>
                </div>
                <div className="card">
                  <h3 className="text-lg font-semibold mb-2">Win Streak</h3>
                  <p className="text-2xl font-bold text-orange-500">
                    {state.battleStats.winStreak}
                  </p>
                </div>
                <div className="card">
                  <h3 className="text-lg font-semibold mb-2">Battle Rating</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {state.battleRating}
                  </p>
                </div>
              </div>
            )}

            <DailyRewardSystem />
            <Achievements />
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
        return isAdmin ? <AdminDashboard onClose={() => setCurrentView('home')} /> : <div>Access Denied</div>;
      case 'battle':
        return <BattleMode onClose={() => setCurrentView('home')} />;
      default:
        return <div>Content not found</div>;
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="content-container">
          <UserProgress showSettings={true} />
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