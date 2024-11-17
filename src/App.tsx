<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { GavelIcon, Settings } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AdminProvider } from './contexts/AdminContext';
import AuthForm from './components/Auth/AuthForm';
import { useAuth } from './contexts/AuthContext';
import { useGame } from './contexts/GameContext';
import Navigation from './components/Navigation';
import UserProgress from './components/UserProgress';
import BattleMode from './components/BattleMode';
import LeaderboardList from './components/Leaderboard/LeaderboardList';
import Store from './components/Store';
import UserSettings from './components/UserSettings';
import DebugMenu from './components/AdminDebug/DebugMenu';
import { 
  AchievementNotification, 
  AchievementSystem 
} from './components/Achievements';
import DailyRewardSystem from './components/DailyRewards/DailyRewardSystem';
import LootBox from './components/LootBox';
import DailyChallenges from './components/DailyChallenges';
import Inventory from './components/UserProfile/Inventory';
import QuestSystem from './components/QuestSystem';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Achievement } from './types/achievements';
import { subscribeToAchievements } from './utils/achievementSubscription';
import ItemManager from './components/admin/ItemManager';
import AdminDashboard from './components/admin/AdminDashboard';

console.log('Loading App component');

function AppContent() {
  console.log('Rendering AppContent');
  const { user } = useAuth();
  const { state, dispatch } = useGame();
  const [currentView, setCurrentView] = useState<'home' | 'leaderboard' | 'quests' | 'store' | 'profile' | 'inventory' | 'admin'>('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDebugMenuOpen, setIsDebugMenuOpen] = useState(false);
  const [isBattleMode, setIsBattleMode] = useState(false);
  const [showAchievementNotification, setShowAchievementNotification] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    console.log('Auth state:', { user });
  }, [user]);

  useEffect(() => {
    if (user && !state.quests?.length) {
      dispatch({
        type: 'INITIALIZE_QUESTS',
        payload: [
          {
            id: 'daily_1',
            title: 'Estudo Constitucional',
            description: 'Complete 3 estudos de caso de Direito Constitucional',
            xpReward: 150,
            coinReward: 75,
            type: 'daily',
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
            progress: 0,
            requirements: [
              {
                id: 'req_1',
                description: 'Ler o material de estudo',
                type: 'level',
                value: 1,
                completed: false
              },
              {
                id: 'req_2',
                description: 'Resolver os casos práticos',
                type: 'xp',
                value: 100,
                completed: false
              },
              {
                id: 'req_3',
                description: 'Responder o questionário',
                type: 'streak',
                value: 1,
                completed: false
              }
            ]
          }
        ]
      });
    }
  }, [user]);

  useEffect(() => {
    // Listen for achievement unlocks
    const unsubscribe = subscribeToAchievements((achievement) => {
      setUnlockedAchievement(achievement);
      setShowAchievementNotification(true);
    });

    return () => unsubscribe();
  }, []);

  if (!user) {
    console.log('No user, showing AuthForm');
    return <AuthForm />;
  }

  const isAdmin = user.roles?.includes('admin');
=======
import React from 'react';
import { GavelIcon } from 'lucide-react';
import { GameProvider } from './contexts/GameContext';
import { useLanguage } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import UserProgress from './components/UserProgress';
import DailyChallenges from './components/DailyChallenges';
import BattleMode from './components/BattleMode';
import { XPSystem } from './components/RewardSystem/XPSystem';
import { LevelSystem } from './components/RewardSystem/LevelSystem';
import { Achievements } from './components/RewardSystem/Achievements';
import { PremiumRewards } from './components/RewardSystem/PremiumRewards';
import Leaderboard from './components/Leaderboard';
import QuestSystem from './components/QuestSystem';
import Store from './components/Store';
import AuthForm from './components/Auth/AuthForm';

// Componente de Loading
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-brand-teal-500"></div>
  </div>
);

export default function App() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = React.useState<'home' | 'leaderboard' | 'quests' | 'store' | 'profile'>('home');
  const [isBattleMode, setIsBattleMode] = React.useState(false);

  // Mostra loading screen enquanto verifica autenticação
  if (loading) {
    return <LoadingScreen />;
  }

  // Redireciona para login se não estiver autenticado
  if (!user) {
    return <AuthForm />;
  }
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d

  const renderView = () => {
    switch (currentView) {
      case 'leaderboard':
<<<<<<< HEAD
        return <LeaderboardList />;
      case 'quests':
        return (
          <div className="space-y-6">
            <QuestSystem />
            <DailyChallenges />
          </div>
        );
      case 'store':
        return <Store />;
      case 'inventory':
        return <Inventory />;
=======
        return <Leaderboard />;
      case 'quests':
        return <QuestSystem />;
      case 'store':
        return <Store />;
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
      case 'profile':
        return (
          <>
            <UserProgress showSettings />
<<<<<<< HEAD
            <AchievementSystem />
          </>
        );
      case 'admin':
        if (isAdmin) {
          return (
            <div className="space-y-6">
              <AdminDashboard onClose={() => setCurrentView('home')} />
            </div>
          );
        }
        return null;
      default:
        return (
          <>
            <DailyRewardSystem />
            <DailyChallenges />
            <AchievementSystem />
=======
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <LevelSystem />
              <Achievements />
            </div>
            <PremiumRewards />
          </>
        );
      default:
        return (
          <>
            <UserProgress />
            <DailyChallenges />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <XPSystem />
              <Achievements />
            </div>
            <PremiumRewards />
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
          </>
        );
    }
  };

  return (
<<<<<<< HEAD
    <ErrorBoundary>
      {!user ? (
        <AuthForm />
      ) : (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-20">
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
                  Batalha Rápida
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setIsDebugMenuOpen(true)}
                    className="p-2 hover:bg-brand-teal-500/20 rounded-lg transition-colors"
                    aria-label="Open debug menu"
                  >
                    <Settings size={20} className="text-white" />
                  </button>
                )}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 hover:bg-brand-teal-500/20 rounded-lg transition-colors"
                  aria-label="Open settings"
                >
                  <Settings size={20} className="text-white" />
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 py-6">
            {renderView()}
          </main>

          <Navigation 
            currentView={currentView} 
            onViewChange={setCurrentView}
            showInventory={true}
          />
          {isBattleMode && <BattleMode onClose={() => setIsBattleMode(false)} />}
          {isSettingsOpen && <UserSettings onClose={() => setIsSettingsOpen(false)} />}
          {isDebugMenuOpen && <DebugMenu onClose={() => setIsDebugMenuOpen(false)} />}
          
          <LootBox
            isOpen={state.showLevelUpReward}
            onClose={() => dispatch({ type: 'DISMISS_LEVEL_UP_REWARD' })}
            rewards={state.currentLevelRewards || []}
          />
          {showAchievementNotification && unlockedAchievement && (
            <AchievementNotification
              achievement={unlockedAchievement}
              onClose={() => setShowAchievementNotification(false)}
            />
          )}
        </div>
      )}
    </ErrorBoundary>
  );
}

export default function App() {
  console.log('Rendering App');
  
  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      console.error('App Error:', error, errorInfo);
    }}>
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
=======
    <GameProvider>
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
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
          {renderView()}
        </main>

        <Navigation currentView={currentView} onViewChange={setCurrentView} />
        {isBattleMode && <BattleMode onClose={() => setIsBattleMode(false)} />}
      </div>
    </GameProvider>
  );
}
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
