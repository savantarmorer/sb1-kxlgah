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

  // Memoize level calculations
  const currentCalculatedLevel = useMemo(() => 
    LevelSystem.calculate_level(state.user.xp),
    [state.user.xp]
  );

  // Handle level up
  useEffect(() => {
    if (currentCalculatedLevel > state.user.level && !hasLeveledUp.current) {
      hasLeveledUp.current = true;
      const rewards = LevelSystem.get_level_rewards(currentCalculatedLevel);
      
      dispatch({
        type: 'LEVEL_UP',
        payload: {
          level: currentCalculatedLevel,
          rewards
        }
      });

      showSuccess(t('levelUp.title', { level: currentCalculatedLevel }));
    }
  }, [currentCalculatedLevel, state.user.level, dispatch, showSuccess, t]);

  // Reset level up flag when level changes
  useEffect(() => {
    hasLeveledUp.current = false;
  }, [state.user.level]);

  // Return memoized values
  return useMemo(() => ({
    current_level: state.user.level,
    current_xp: state.user.xp,
    progress: LevelSystem.calculate_progress(state.user.xp),
    xp_to_next_level: LevelSystem.calculate_xp_to_next_level(state.user.xp),
    total_xp_for_current_level: LevelSystem.calculate_total_xp_for_level(state.user.level)
  }), [state.user.level, state.user.xp]);
}
