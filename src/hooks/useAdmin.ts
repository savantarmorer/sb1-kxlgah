import { useGame } from '../contexts/GameContext';
import { useNotificationSystem } from '../utils/notificationSystem';

/**
 * Interface for debug actions available to admins
 */
interface DebugActions {
  resetStreak: () => void;
  modifyRewards: (multipliers: Record<string, number>) => void;
  simulateLogin: () => void;
  unlockAchievement: (achievementId: string) => void;
  toggleDebugMode: () => void;
  resetProgress: () => void;
}

/**
 * Hook for admin functionality and permissions
 * Provides admin-only actions and state management
 */
export function useAdmin() {
  const { state, dispatch } = useGame();
  const notify = useNotificationSystem();

  // Check if current user has admin role
  const isAdmin = state.user?.roles?.includes('admin') || false;

  /**
   * Debug actions for admin testing
   */
  const debugActions: DebugActions = {
    /**
     * Resets user's streak
     * Used for testing streak mechanics
     */
    resetStreak: () => {
      if (!isAdmin) {
        notify.showError('Admin access required');
        return;
      }
      dispatch({ type: 'RESET_STREAK' });
      notify.showSuccess('Streak reset successfully');
    },

    /**
     * Modifies reward multipliers
     * Used for testing reward mechanics
     */
    modifyRewards: (multipliers: Record<string, number>) => {
      if (!isAdmin) {
        notify.showError('Admin access required');
        return;
      }
      dispatch({ type: 'UPDATE_REWARD_MULTIPLIERS', payload: multipliers });
      notify.showSuccess('Reward multipliers updated');
    },

    /**
     * Simulates a daily login
     * Used for testing login rewards
     */
    simulateLogin: () => {
      if (!isAdmin) {
        notify.showError('Admin access required');
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      dispatch({ type: 'RECORD_LOGIN', payload: today });
      notify.showSuccess('Login simulated');
    },

    /**
     * Unlocks an achievement instantly
     * Used for testing achievement system
     */
    unlockAchievement: (achievementId: string) => {
      if (!isAdmin) {
        notify.showError('Admin access required');
        return;
      }
      dispatch({
        type: 'UPDATE_ACHIEVEMENT_PROGRESS',
        payload: { id: achievementId, progress: 100 }
      });
      notify.showSuccess('Achievement unlocked');
    },

    /**
     * Toggles debug mode
     * Used for showing additional debug information
     */
    toggleDebugMode: () => {
      if (!isAdmin) {
        notify.showError('Admin access required');
        return;
      }
      dispatch({ type: 'TOGGLE_DEBUG_MODE' });
      notify.showSuccess('Debug mode toggled');
    },

    /**
     * Resets user progress
     * Used for testing progression system
     */
    resetProgress: () => {
      if (!isAdmin) {
        notify.showError('Admin access required');
        return;
      }
      dispatch({ type: 'SET_USER', payload: {
        ...state.user,
        level: 1,
        xp: 0,
        coins: 100,
        streak: 0,
        achievements: []
      }});
      notify.showSuccess('Progress reset');
    }
  };

  return {
    isAdmin,
    debugActions
  };
}

/**
 * Hook Dependencies:
 * - useGame: For accessing and modifying game state
 * - useNotificationSystem: For user feedback
 * 
 * State Management:
 * - Uses GameContext for state
 * - Handles admin permissions
 * - Manages debug actions
 * 
 * Used By:
 * - AdminDashboard component
 * - Debug components
 * - Testing utilities
 * 
 * Features:
 * - Permission checking
 * - Debug actions
 * - User feedback
 * - State manipulation
 * 
 * Scalability:
 * - Easy to add new debug actions
 * - Centralized admin logic
 * - Type-safe operations
 * - Proper error handling
 * 
 * Security:
 * - Permission checks
 * - Admin-only actions
 * - Safe state updates
 */

