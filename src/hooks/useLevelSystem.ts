import { useEffect, useMemo, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { LevelSystem } from '../lib/levelSystem';
import { useNotification } from '../contexts/NotificationContext';
import { useTranslation } from '../contexts/LanguageContext';


export function useLevelSystem() {
  const { state, dispatch } = useGame();
  const { showSuccess } = useNotification();
  const { t } = useTranslation();
  const hasLeveledUp = useRef(false);

  if (!state.user) {
    return {
      current_level: 1,
      current_xp: 0,
      progress: 0,
      xp_to_next_level: 0,
      total_xp_for_current_level: 0
    };
  }

  // After null check, we can safely assert user is non-null
  const user = state.user!;

  // Memoize level calculations
  const currentCalculatedLevel = useMemo(() => 
    LevelSystem.calculate_level(user.xp),
    [user.xp]
  );

  // Handle level up
  useEffect(() => {
    if (currentCalculatedLevel > user.level && !hasLeveledUp.current) {
      hasLeveledUp.current = true;
      const rewards = LevelSystem.get_level_rewards(currentCalculatedLevel);
      
      // First show the notification
      showSuccess(t('levelUp.title', { level: currentCalculatedLevel }));

      // Then dispatch level up with rewards and show lootbox
      dispatch({
        type: 'LEVEL_UP',
        payload: {
          level: currentCalculatedLevel,
          rewards,
          showReward: true
        }
      });
    }
  }, [currentCalculatedLevel, user.level, dispatch, showSuccess, t]);

  // Reset level up flag when level changes
  useEffect(() => {
    hasLeveledUp.current = false;
  }, [user.level]);

  // Return memoized values
  return useMemo(() => ({
    current_level: user.level,
    current_xp: user.xp,
    progress: LevelSystem.calculate_progress(user.xp),
    xp_to_next_level: LevelSystem.calculate_xp_to_next_level(user.xp),
    total_xp_for_current_level: LevelSystem.calculate_total_xp_for_level(user.level)
  }), [user.level, user.xp]);
}
