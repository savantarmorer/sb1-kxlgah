import { useCallback } from 'react';
import { use_game } from '../contexts/GameContext';
import { AchievementService } from '../services/achievementService';
import { Achievement } from '../types/achievements';
import { toast } from 'react-hot-toast';

export function useAchievements() {
  const { state, dispatch } = use_game();

  const initializeAchievements = async () => {
    const achievements = await AchievementService.getUserAchievements(state.user.id);
    dispatch({ type: 'INITIALIZE_ACHIEVEMENTS', payload: achievements });
  };

  const checkTrigger = useCallback(async (triggerType: string, value: number) => {
    const unlockedAchievements = await AchievementService.checkTriggers(
      state.user.id,
      triggerType,
      value,
      state.achievements
    );

    if (unlockedAchievements.length > 0) {
      // Update achievements in state
      dispatch({ type: 'ADD_ACHIEVEMENT', payload: unlockedAchievements[0] });

      // Show notifications
      unlockedAchievements.forEach(achievement => {
        toast.success(`Achievement Unlocked: ${achievement.title}`, {
          duration: 5000,
          icon: '🏆'
        });
      });
    }
  }, [state.user.id, state.achievements, dispatch]);

  const claimAchievement = useCallback(async (achievementId: string) => {
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
  }, [state.user.id, state.achievements, dispatch]);

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
