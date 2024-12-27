import { useCallback, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { AchievementService } from '../services/achievementService';
import { Achievement } from '../types/achievements';
import { toast } from 'react-hot-toast';

export function useAchievements() {
  const { state, dispatch } = useGame();

  const initializeAchievements = useCallback(async () => {
    if (!state.user?.id) return;
    
    try {
      const achievements = await AchievementService.getUserAchievements(state.user.id);
      dispatch({ type: 'UNLOCK_ACHIEVEMENTS', payload: achievements });
    } catch (error) {
      console.error('Error initializing achievements:', error);
    }
  }, [state.user?.id, dispatch]);

  // Auto-initialize achievements when user is available
  useEffect(() => {
    if (state.user?.id && (!state.achievements || state.achievements.length === 0)) {
      initializeAchievements();
    }
  }, [state.user?.id, state.achievements, initializeAchievements]);

  const checkTrigger = useCallback(async (triggerType: string, value: number) => {
    if (!state.user?.id) return;

    try {
      const updatedAchievements = await AchievementService.checkTriggers(
        state.user.id,
        triggerType,
        value,
        state.achievements
      );

      if (updatedAchievements.length > 0) {
        dispatch({ type: 'UNLOCK_ACHIEVEMENTS', payload: updatedAchievements });

        // Show notifications only for newly unlocked achievements
        updatedAchievements
          .filter(achievement => achievement.unlocked && achievement.progress === 100)
          .forEach(achievement => {
            toast.success(`Achievement Unlocked: ${achievement.title}`, {
              duration: 5000,
              icon: '🏆'
            });
          });
      }
    } catch (error) {
      console.error('Error checking achievement triggers:', error);
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
          type: 'UNLOCK_ACHIEVEMENTS',
          payload: [{ ...achievement, claimed: true }]
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
    achievements: state.achievements || [],
    initializeAchievements,
    checkTrigger,
    claimAchievement,
    check_achievements: async (triggerType: string, value: number) => {
      await checkTrigger(triggerType, value);
    }
  };
}
