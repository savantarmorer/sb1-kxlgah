import React, { createContext, useContext } from 'react';
import { useGame } from './GameContext';

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
  const { state, dispatch } = useGame();
  const isAdmin = state.user.roles?.includes('admin') || false;

  const debugActions = {
    resetStreak: () => {
      if (!isAdmin) return;
      dispatch({ type: 'RESET_STREAK' });
    },
    modifyRewards: (rewards: any) => {
      if (!isAdmin) return;
      // Add reward modification logic here
    },
    simulateLogin: () => {
      if (!isAdmin) return;
      const today = new Date().toISOString().split('T')[0];
      dispatch({ type: 'RECORD_LOGIN', payload: today });
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