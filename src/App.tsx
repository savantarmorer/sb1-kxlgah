import React, { useState } from 'react';
import { GavelIcon, Settings } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { AdminProvider } from './contexts/AdminContext';
import { useAuth } from './contexts/AuthContext';
import { useGame } from './contexts/GameContext';
import { useLanguage } from './contexts/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Components
import Navigation from './components/Navigation';
import UserProgress from './components/UserProgress';
import BattleMode from './components/BattleMode';
import DailyRewardSystem from './components/DailyRewards/DailyRewardSystem';
import DailyChallenges from './components/DailyChallenges';
import { XPSystem } from './components/RewardSystem/XPSystem';
import { LevelSystem } from './components/RewardSystem/LevelSystem';
import { Achievements } from './components/RewardSystem/Achievements';
import { PremiumRewards } from './components/RewardSystem/PremiumRewards';
import Leaderboard from './components/Leaderboard';
import QuestSystem from './components/QuestSystem';
import Store from './components/Store';
import AuthForm from './components/Auth/AuthForm';
import UserSettings from './components/UserSettings';
import AdminDashboard from './components/admin/AdminDashboard';

// Loading screen component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-brand-teal-500"></div>
  </div>
);

function AppContent() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { state } = useGame();
  const [currentView, setCurrentView] = useState<'home' | 'leaderboard' | 'quests' | 'store' | 'profile' | 'admin'>('home');
  const [isBattleMode, setIsBattleMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const isAdmin = user?.roles?.includes('admin');

  const renderView = () => {
    switch (currentView) {
      case 'leaderboard':
        return <Leaderboard />;
      case 'quests':
        return (
          <div className="space-y-6">
            <QuestSystem />
            <DailyChallenges />
          </div>
        );
      case 'store':
        return <Store />;
      case 'profile':
        return (
          <>
            <UserProgress showSettings />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <LevelSystem />
              <Achievements />
            </div>
            <PremiumRewards />
          </>
        );
      case 'admin':
        if (isAdmin) {
          return <AdminDashboard onClose={() => setCurrentView('home')} />;
        }
        return null;
      default:
        return (
          <>
            <DailyRewardSystem />
            <DailyChallenges />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <XPSystem />
              <Achievements />
            </div>
            <PremiumRewards />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-gradient-to-r from-brand-teal-600 to-brand-teal-700 dark:from-brand-teal-800 dark:to-brand-teal-900 text-white py-4 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GavelIcon size={32} className="text-brand-teal-200" />
            <h1 className="text-2xl font-bold">CepaC Play</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsBattleMode(true)}
              className="bg-brand-teal-500 hover:bg-brand-teal-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {t('battle.quickBattle')}
            </button>
            {isAdmin && (
              <button
                onClick={() => setIsAdminOpen(true)}
                className="p-2 hover:bg-brand-teal-500/20 rounded-lg transition-colors"
              >
                <Settings size={20} className="text-white" />
              </button>
            )}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-brand-teal-500/20 rounded-lg transition-colors"
            >
              <Settings size={20} className="text-white" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {renderView()}
      </main>

      <Navigation 
        currentView={currentView} 
        onViewChange={setCurrentView}
        showAdmin={isAdmin}
      />

      {isBattleMode && <BattleMode onClose={() => setIsBattleMode(false)} />}
      {isSettingsOpen && <UserSettings onClose={() => setIsSettingsOpen(false)} />}
      {isAdminOpen && <AdminDashboard onClose={() => setIsAdminOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <GameProvider>
              <AdminProvider>
                <AppContent />
              </AdminProvider>
            </GameProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
