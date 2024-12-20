import { useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAchievements } from './useAchievements';

export function useAchievementTriggers() {
  const { state } = useGame();
  const { checkTrigger } = useAchievements();

  // Track XP gains
  useEffect(() => {
    checkTrigger('xp_gained', state.user?.xp || 0);
  }, [state.user?.xp]);

  // Track battle stats
  useEffect(() => {
    if (state.user?.battle_stats) {
      checkTrigger('battle_wins', state.user.battle_stats.wins);
      checkTrigger('battle_rating', state.user.battle_stats.tournament_rating || 0);
      checkTrigger('battle_streak', state.user.battle_stats.highest_streak);
    }
  }, [state.user?.battle_stats]);

  // Track login streak
  useEffect(() => {
    if (state.user?.login_streak) {
      checkTrigger('login_days', state.user.login_streak.current);
    }
  }, [state.user?.login_streak]);

  // Track quest completion
  useEffect(() => {
    const completedQuests = state.quests?.completed?.length || 0;
    checkTrigger('quests_completed', completedQuests);
  }, [state.quests?.completed]);

  // Track reward rarity (for legendary rewards)
  useEffect(() => {
    const checkRewardRarity = (rarity: string) => {
      if (rarity === 'legendary') {
        checkTrigger('reward_rarity', 4); // 4 represents legendary rarity
      }
    };

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Track battle score
  useEffect(() => {
    if (state.battle_status?.score) {
      checkTrigger('battle_score', state.battle_status.score);
    }
  }, [state.battle_status?.score]);

  // Track highest streak
  useEffect(() => {
    if (state.user.streak) {
      checkTrigger('highest_streak', state.user.streak);
    }
  }, [state.user.streak]);

  return null; // This hook is used for side effects only
} 