import React, { createContext, useContext } from 'react';
import { useGame } from './GameContext';
import { QuestService } from '../services/questService';
import { useNotification } from './NotificationContext';

interface AdminContextType {
  isAdmin: boolean;
  debugActions: {
    resetStreak: () => void;
    modifyRewards: (rewards: Record<string, unknown>) => void;
    simulateLogin: () => void;
  };
  assignQuestToUser: (userId: string, questId: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Separate the context value creation to avoid fast refresh warning
const createAdminValue = (
  isAdmin: boolean,
  debugActions: AdminContextType['debugActions'],
  assignQuestToUser: AdminContextType['assignQuestToUser']
): AdminContextType => ({
  isAdmin,
  debugActions,
  assignQuestToUser
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { state, dispatch, initialized } = useGame();
  const notifications = useNotification();
  const isAdmin = initialized && state.user?.roles?.includes('admin') || false;

  const debugActions = {
    resetStreak: () => {
      if (!isAdmin || !initialized) {
        notifications.showError('Not authorized or game not initialized');
        return;
      }
      dispatch({ type: 'UPDATE_USER_STATS', payload: { streak: 0, xp: 0, coins: 0 } });
      notifications.showSuccess('Streak reset successfully');
    },
    modifyRewards: (rewards: Record<string, unknown>) => {
      if (!isAdmin || !initialized) {
        notifications.showError('Not authorized or game not initialized');
        return;
      }
      dispatch({ type: 'CLAIM_REWARD', payload: rewards });
      notifications.showSuccess('Rewards modified successfully');
    },
    simulateLogin: () => {
      if (!isAdmin || !initialized) {
        notifications.showError('Not authorized or game not initialized');
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      dispatch({ 
        type: 'UPDATE_LOGIN_STREAK', 
        payload: { streak: 0, last_login_date: today }
      });
      notifications.showSuccess('Login simulated successfully');
    }
  };

  const assignQuestToUser = async (userId: string, questId: string) => {
    if (!isAdmin || !initialized) {
      notifications.showError('Not authorized or game not initialized');
      return;
    }

    try {
      await QuestService.assignQuestToUser(userId, questId);
      notifications.showSuccess('Quest assigned successfully');
    } catch (error) {
      console.error('Error assigning quest:', error);
      notifications.showError('Failed to assign quest');
    }
  };

  const value = createAdminValue(isAdmin, debugActions, assignQuestToUser);

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}; 