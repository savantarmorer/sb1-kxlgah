import { useGame } from '../contexts/GameContext';
import { BattleService } from '../services/battleService';
import { RewardService } from '../services/rewardService';
import { Reward } from '../types/rewards';

export function useBattleStreak() {
  const { state, dispatch } = useGame();

  const handleBattleResult = async (isVictory: boolean): Promise<Reward[]> => {
    const newStreak = await BattleService.updateWinStreak(state.user.id, isVictory);
    
    let rewards: Reward[] = [];

    // Check for streak-based rewards
    if (isVictory && newStreak % 3 === 0) { // Every 3 wins
      const streakReward = RewardService.createLootboxReward(newStreak);
      rewards.push(streakReward);
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: 'achievement',
          message: `Win Streak: ${newStreak}! Earned a special lootbox!`
        }
      });
    }

    return rewards;
  };

  return {
    handleBattleResult,
    currentStreak: state.battleStats?.winStreak || 0
  };
}

/**
 * Role: Manages battle streak rewards
 * Dependencies:
 * - GameContext
 * - BattleService
 * - RewardService
 * Used by:
 * - BattleMode component
 * Features:
 * - Streak tracking
 * - Automatic reward distribution
 * - Notification system
 */ 