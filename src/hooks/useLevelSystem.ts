import { useEffect, useMemo, useRef } from 'react';
import { use_game } from '../contexts/GameContext';
import { LevelSystem } from '../lib/levelSystem';
import { useNotification } from '../contexts/NotificationContext';
import { use_language } from '../contexts/LanguageContext';

export function useLevelSystem() {
  const { state, dispatch } = use_game();
  const { showSuccess, showNotification } = useNotification();
  const { t } = use_language();
  const hasLeveledUp = useRef(false);

  // Memoize level calculations to prevent unnecessary recalculations
  const currentCalculatedLevel = useMemo(() => 
    LevelSystem.calculate_level(state.user.xp),
    [state.user.xp]
  );

  useEffect(() => {
    // Only trigger level up if the calculated level is higher than current level
    // and we haven't already processed this level up
    if (currentCalculatedLevel > state.user.level && !hasLeveledUp.current) {
      hasLeveledUp.current = true;
      const rewards = LevelSystem.get_level_rewards(currentCalculatedLevel);
      
      dispatch({
        type: 'LEVEL_UP',
        payload: {
          level: currentCalculatedLevel,
          rewards: {
            xp: rewards.reduce((sum, r) => r.type === 'xp' ? sum + r.value : sum, 0),
            coins: rewards.reduce((sum, r) => r.type === 'coins' ? sum + r.value : sum, 0)
          }
        }
      });

      // Show level up notification
      const rewardsText = rewards
        .map(r => `${r.type === 'xp' ? 'XP' : 'Coins'}: +${r.value}`)
        .join(', ');

      showSuccess(`${t('levelUp.title', { level: currentCalculatedLevel })}
${t('levelUp.description')}
${rewards.length > 0 ? `Rewards: ${rewardsText}` : ''}`);
    }
  }, [currentCalculatedLevel, state.user.level, dispatch, showSuccess, t]);

  // Reset the level up flag when the level changes
  useEffect(() => {
    hasLeveledUp.current = false;
  }, [state.user.level]);

  // Memoize return values to prevent unnecessary recalculations
  return useMemo(() => ({
    current_level: state.user.level,
    current_xp: state.user.xp,
    progress: LevelSystem.calculate_progress(state.user.xp),
    xp_to_next_level: LevelSystem.calculate_xp_to_next_level(state.user.xp),
    total_xp_for_current_level: LevelSystem.calculate_total_xp_for_level(state.user.level)
  }), [state.user.level, state.user.xp]);
}
