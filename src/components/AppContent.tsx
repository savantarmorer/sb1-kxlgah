import React from 'react';
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
import { use_game } from '../contexts/GameContext';
import TournamentMode from './Tournament/TournamentMode';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = use_game();
  
  const handleBattleClose = () => {
    navigate('/home');
  };

  const handleViewChange = (view: View) => {
    console.log('Navigation clicked:', view);
    // Remove /home from the current path to get the base route
    const baseRoute = view === '/' ? '/home' : `/home${view}`;
    navigate(baseRoute);
  };

  // Get the current view by removing /home prefix
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