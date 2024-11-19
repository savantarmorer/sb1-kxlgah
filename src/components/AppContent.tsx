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
import BattleMode from './BattleMode';
import AdminDashboard from './admin/AdminDashboard';
import { Swords } from 'lucide-react';

type View = 'home' | 'leaderboard' | 'quests' | 'store' | 'profile' | 'inventory' | 'admin' | 'battle';

export default function AppContent() {
  const [currentView, setCurrentView] = useState<View>('home');
  const { state } = useGame();
  const [showBattle, setShowBattle] = useState(false);

  const isAdmin = state.user.roles?.includes('admin');

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="space-y-6">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowBattle(true)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
              >
                <Swords size={20} />
                <span>Battle Mode</span>
              </button>
            </div>
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
      default:
        return <div>Content not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <UserProgress showSettings={true} />
        <main className="mt-6">
          {renderContent()}
        </main>
      </div>
      <Navigation
        currentView={currentView}
        onViewChange={setCurrentView}
        showInventory={state.user.roles?.includes('premium')}
        isAdmin={isAdmin}
      />
      {showBattle && <BattleMode onClose={() => setShowBattle(false)} />}
    </div>
  );
} 