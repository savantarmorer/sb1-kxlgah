import { useEffect } from 'react';
import { use_game } from '../contexts/GameContext';
import { LevelSystem } from '../lib/levelSystem';
import { useNotification } from '../contexts/NotificationContext';
import { use_language } from '../contexts/LanguageContext';

export function useLevelSystem() {
  const { state, dispatch } = use_game();
  const { showNotification } = useNotification();
  const { t } = use_language();

  useEffect(() => {
    const current_level = LevelSystem.calculate_level(state.user.xp);
    if (current_level > state.user.level) {
      const rewards = LevelSystem.get_level_rewards(current_level);
      
      dispatch({
        type: 'LEVEL_UP',
        payload: {
          level: current_level,
          rewards: {
            xp: rewards.reduce((sum, r) => r.type === 'xp' ? sum + r.value : sum, 0),
            coins: rewards.reduce((sum, r) => r.type === 'coins' ? sum + r.value : sum, 0)
          }
        }
      });

      // Show level up notification
      showNotification({
        type: 'achievement',
        message: {
          title: t('levelUp.title', { level: current_level }),
          description: t('levelUp.description'),
          rewards
        },
        duration: 5000
      });
    }
  }, [state.user.xp, state.user.level, dispatch, showNotification, t]);

  return {
    current_level: state.user.level,
    current_xp: state.user.xp,
    progress: LevelSystem.calculate_progress(state.user.xp),
    xp_to_next_level: LevelSystem.calculate_xp_to_next_level(state.user.xp),
    total_xp_for_current_level: LevelSystem.calculate_total_xp_for_level(state.user.level)
  };
}
