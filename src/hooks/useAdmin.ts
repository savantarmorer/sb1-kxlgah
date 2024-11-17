import { useGame } from '../contexts/GameContext';

export function useAdmin() {
  const { state, dispatch } = useGame();
  const isAdmin = state.user.roles?.includes('admin') || false;

  const debugActions = {
    resetStreak: () => {
      if (!isAdmin) return;
      dispatch({ type: 'RESET_STREAK' });
    },
    modifyRewards: (rewards: any) => {
      if (!isAdmin) return;
      dispatch({ type: 'UPDATE_REWARD_MULTIPLIERS', payload: rewards });
    },
    simulateLogin: () => {
      if (!isAdmin) return;
      const today = new Date().toISOString().split('T')[0];
      dispatch({ type: 'RECORD_LOGIN', payload: today });
    },
    unlockAchievement: (achievementId: string) => {
      if (!isAdmin) return;
      dispatch({
        type: 'UPDATE_ACHIEVEMENT_PROGRESS',
        payload: { id: achievementId, progress: 100 }
      });
    }
  };

  return {
    isAdmin,
    debugActions
  };
}