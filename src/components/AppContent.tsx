import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import Dashboard from './Dashboard/Dashboard';
import BattleMode from './Battle/BattleMode';
import InventorySystem from './inventory/InventorySystem';
import ShopSystem from './Shop/ShopSystem';
import Settings from './Settings/Settings';
import UserProfile from './UserProfile/ProfileDashboard';
import UserProgress from './UserProfile/UserProgress';
import { View } from '../types/navigation';
import { useGame } from '../contexts/GameContext';
import TournamentMode from './Tournament/TournamentMode';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingScreen from './LoadingScreen';

export default function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useGame();
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Only set loading to false if it was previously true
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, isLoading]);

  const handleBattleClose = () => {
    navigate('/home');
  };

  const handleViewChange = (view: View) => {
    // Set loading only if navigating to a different view
    if (location.pathname !== view) {
      setIsLoading(true);
    }
    const baseRoute = view === '/' ? '/home' : `/home${view}`;
    navigate(baseRoute);
  };

  const currentView = location.pathname.replace('/home', '') as View;
  console.log('Current view:', currentView);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="pb-16">
        <main className="max-w-screen-xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/battle" element={<BattleMode on_close={handleBattleClose} />} />
            <Route path="/inventory" element={<InventorySystem />} />
            <Route path="/shop" element={<ShopSystem />} />
            <Route path="/tournament" element={<TournamentMode />} />
            <Route path="/settings" element={
              <div className="space-y-6">
                <UserProgress />
                <UserProfile />
                <Settings />
              </div>
            } />
          </Routes>
        </main>
      </div>
      <Navigation 
        currentView={currentView}
        onViewChange={handleViewChange}
        isAdmin={state.user.roles?.includes('admin')}
      />
      <ToastContainer />
    </div>
  );
}