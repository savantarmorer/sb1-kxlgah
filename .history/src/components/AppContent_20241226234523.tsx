import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Navigation from './Navigation';
import Dashboard from './Dashboard/Dashboard';
import BattleMode from './Battle/BattleMode';
import InventorySystem from './inventory/InventorySystem';
import ShopSystem from './Shop/ShopSystem';
import Settings from './Settings/Settings';
import UserProfile from './UserProfile/ProfileDashboard';
import UserProgress from './UserProfile/UserProgress';
import { AchievementsPage } from './Achievements/AchievementsPage';
import QuestSystem from './QuestSystem';
import type { View } from '../types/navigation';
import { useGame } from '../contexts/GameContext';
import TournamentMode from './Tournament/TournamentMode';
import { ToastContainer, ToastContainerProps } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingScreen from './LoadingScreen';

const ROUTE_BASE = '/home';

const toastConfig: ToastContainerProps & { toastStyle: React.CSSProperties } = {
  position: "bottom-right",
  autoClose: 5000,
  hideProgressBar: false,
  newestOnTop: true,
  closeOnClick: true,
  rtl: false,
  pauseOnFocusLoss: true,
  draggable: true,
  pauseOnHover: true,
  theme: "dark",
  toastStyle: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'white'
  }
};

export default function AppContent(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useGame();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  useEffect(() => {
    if (!isLoading) return;

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname, isLoading]);

  const handleBattleClose = (): void => {
    navigate(ROUTE_BASE);
  };

  const handleViewChange = (view: View): void => {
    if (location.pathname !== view) {
      setIsLoading(true);
    }
    const baseRoute = view === '/' ? ROUTE_BASE : `${ROUTE_BASE}${view}`;
    navigate(baseRoute);
  };

  const currentView = location.pathname.replace(ROUTE_BASE, '') as View;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
      </div>

      {/* Main content */}
      <div className="relative min-h-screen">
        <main className="max-w-7xl mx-auto px-4 pt-24 pb-28">
          {isLoading ? (
            <LoadingScreen />
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/battle" element={<BattleMode on_close={handleBattleClose} />} />
              <Route path="/inventory" element={<InventorySystem />} />
              <Route path="/shop" element={<ShopSystem />} />
              <Route path="/tournament" element={<TournamentMode />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/quests" element={<QuestSystem />} />
              <Route path="/settings" element={
                <div className="space-y-8">
                  <UserProgress />
                  <UserProfile />
                  <Settings />
                </div>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </main>
      </div>

      {/* Navigation */}
      <Navigation 
        currentView={currentView}
        onViewChange={handleViewChange}
        isAdmin={(state.user?.roles?.includes('admin') || state.user?.is_super_admin) ?? false}
      />

      {/* Toast Container with dark theme */}
      <ToastContainer {...toastConfig} />
    </div>
  );
}