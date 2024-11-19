import { useState } from 'react';
import { useGame } from '../contexts/GameContext';

export function useAdmin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state } = useGame();

  const isAdmin = state.user?.roles?.includes('admin') || false;

  const debugActions = {
    resetStreak: () => {},
    modifyRewards: (rewards: any) => {},
    simulateLogin: () => {},
    unlockAchievement: (achievementId: string) => {}
  };

  return {
    isAdmin,
    isLoading,
    error,
    debugActions
  };
}