import React, { createContext, useContext } from 'react';
import { use_game } from './GameContext';

interface AdminContextType {
  isAdmin: boolean;
  debugActions: {
    resetStreak: () => void;
    modifyRewards: (rewards: any) => void;
    simulateLogin: () => void;
  };
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = use_game();
  const isAdmin = state.user.roles?.includes('admin') || false;

  const debugActions = {
    resetStreak: () => {
      if (!isAdmin) return;
      dispatch({ type: 'UPDATE_USER_STATS', payload: { streak: 0, xp: 0, coins: 0 } });
    },
    modifyRewards: (rewards: any) => {
      if (!isAdmin) return;
      dispatch({ type: 'CLAIM_REWARD', payload: rewards });
    },
    simulateLogin: () => {
      if (!isAdmin) return;
      const today = new Date().toISOString().split('T')[0];
      dispatch({ 
        type: 'UPDATE_LOGIN_STREAK', 
        payload: { streak: 0, last_login_date: today }
      });
    }
  };

  return (
    <AdminContext.Provider value={{ isAdmin, debugActions }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
} 