import { useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import { AchievementService } from '../services/achievementService';
import { Achievement } from '../types/achievements';
import { toast } from 'react-hot-toast';
import { useNotification } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabase';

export function useAchievements() {
  const { state, dispatch } = useGame();
  const { showNotification } = useNotification();

  const initializeAchievements = async () => {
    if (!state.user?.id) return;
    const achievements = await AchievementService.getUserAchievements(state.user.id);
    dispatch({ type: 'INITIALIZE_ACHIEVEMENTS', payload: achievements });
  };

  const checkTrigger = useCallback(async (triggerType: string, value: number) => {
    if (!state.user?.id || !state.achievements) return;

    const unlockedAchievements = await AchievementService.checkTriggers(
      state.user.id,
      triggerType,
      value,
      state.achievements
    );

    if (unlockedAchievements.length > 0) {
      dispatch({ type: 'ADD_ACHIEVEMENT', payload: unlockedAchievements[0] });

      unlockedAchievements.forEach(achievement => {
        toast.success(`Achievement Unlocked: ${achievement.title}`, {
          duration: 5000,
          icon: '🏆'
        });
      });
    }
  }, [state.user?.id, state.achievements, dispatch]);

  const claimAchievement = useCallback(async (achievementId: string) => {
    if (!state.user?.id || !state.achievements) return;

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

  const checkAchievementProgress = async () => {
    if (!state.user?.id) return;

    try {
      const { data: achievements, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', state.user.id);

      if (error) throw error;

      if (achievements) {
        // Achievement checking logic here
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
      showNotification('error', 'Failed to check achievements');
    }
  };

  return {
    achievements: state.achievements || [],
    initializeAchievements,
    checkTrigger,
    claimAchievement,
    check_achievements: async (triggerType: string, value: number) => {
      await checkTrigger(triggerType, value);
    },
    checkAchievementProgress
  };
}
