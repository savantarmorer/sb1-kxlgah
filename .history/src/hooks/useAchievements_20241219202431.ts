import { useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import { AchievementService } from '../services/achievementService';
import { Achievement } from '../types/achievements';
import { toast } from 'react-hot-toast';

export function useAchievements() {
  const { state, dispatch } = useGame();

  const initializeAchievements = async () => {
    if (!state.user?.id) return;
    
    const achievements = await AchievementService.getUserAchievements(state.user.id);
    dispatch({ type: 'UNLOCK_ACHIEVEMENTS', payload: achievements });
  };

  const checkTrigger = useCallback(async (triggerType: string, value: number) => {
    if (!state.user?.id) return;

    const unlockedAchievements = await AchievementService.checkTriggers(
      state.user.id,
      triggerType,
      value,
      state.achievements
    );

    if (unlockedAchievements.length > 0) {
      dispatch({ type: 'UNLOCK_ACHIEVEMENTS', payload: unlockedAchievements });

      unlockedAchievements.forEach(achievement => {
        toast.success(`Achievement Unlocked: ${achievement.title}`, {
          duration: 5000,
          icon: '🏆'
        });
      });
    }
  }, [state.user?.id, state.achievements, dispatch]);

  const claimAchievement = useCallback(async (achievementId: string) => {
    if (!state.user?.id) return;
    
    const achievement = state.achievements.find(a => a.id === achievementId);
    if (!achievement) return;

    try {
      const claimed = await AchievementService.claimAchievement(state.user.id, achievementId);
      if (claimed) {
        dispatch({
          type: 'UPDATE_ACHIEVEMENT',
          payload: { ...achievement, claimed: true }
        });

        toast.success(`Claimed rewards for: ${achievement.title}`, {
          duration: 3000,
          icon: '🎁'
        });
      }
    } catch (error) {
      console.error('Error claiming achievement:', error);
      toast.error('Failed to claim achievement rewards');
    }
  }, [state.user?.id, state.achievements, dispatch]);

  return {
    achievements: state.achievements,
    initializeAchievements,
    checkTrigger,
    claimAchievement,
    check_achievements: async (triggerType: string, value: number) => {
      await checkTrigger(triggerType, value);
    }
  };
}
