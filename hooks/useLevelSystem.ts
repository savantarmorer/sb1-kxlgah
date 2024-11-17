import { useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { LevelSystem } from '../lib/levelSystem';
import { LevelUpPayload } from '../types/achievements';

export function useLevelSystem() {
  const { state, dispatch } = useGame();

  useEffect(() => {
    const currentLevel = LevelSystem.calculateLevel(state.user.xp);
    if (currentLevel > state.user.level) {
      const rewards = LevelSystem.handleLevelUp(state.user, state.user.level, currentLevel);
      dispatch({
        type: 'LEVEL_UP',
        payload: {
          newLevel: currentLevel,
          rewards
        } as LevelUpPayload
      });
    }
  }, [state.user.xp]);

  return {
    currentLevel: state.user.level,
    currentXP: state.user.xp,
    progress: LevelSystem.calculateProgress(state.user.xp),
    xpToNextLevel: LevelSystem.calculateXPToNextLevel(state.user.xp),
    totalXPForCurrentLevel: LevelSystem.calculateTotalXPForLevel(state.user.level)
  };
} 