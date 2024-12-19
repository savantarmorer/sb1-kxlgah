import React, { createContext, useContext } from 'react';
import { useGame } from './GameContext';
import { QuestService } from '../services/questService';
import { NotificationSystem } from '../utils/notifications';

interface AdminContextType {
  isAdmin: boolean;
  debugActions: {
    resetStreak: () => void;
    modifyRewards: (rewards: any) => void;
    simulateLogin: () => void;
  };
  assignQuestToUser: (userId: string, questId: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useGame();
  const isAdmin = state.user?.roles?.includes('admin') || false;

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

  const assignQuestToUser = async (userId: string, questId: string) => {
    try {
      await QuestService.assignQuestToUser(userId, questId);
      NotificationSystem.showSuccess('Quest assigned successfully');
    } catch (error) {
      console.error('Error assigning quest:', error);
      NotificationSystem.showError('Failed to assign quest');
    }
  };

  return (
    <AdminContext.Provider value={{ isAdmin, debugActions, assignQuestToUser }}>
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