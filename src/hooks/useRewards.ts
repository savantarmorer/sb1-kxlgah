import { useGame } from '../contexts/GameContext';
import { Achievement, AchievementTrigger } from '../types/achievements';
import { Reward, RewardRarity, RewardType } from '../types/rewards';

/**
 * Interface for reward claim payload
 */
interface RewardClaimPayload {
  id: string;
  type: RewardType;
  value: number;
  rarity: RewardRarity;
}

/**
 * Interface for achievement trigger conditions
 */
interface AchievementTriggerCondition {
  type: 'xp' | 'streak' | 'quest' | 'study_time' | 'score' | 'reward_rarity';
  value: number;
  comparison: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
}

/**
 * Interface for achievement unlock payload
 * Extends Achievement with proper trigger conditions
 */
interface AchievementUnlockPayload {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  rarity: RewardRarity;
  unlocked: boolean;
  unlockedAt: Date;
  prerequisites: string[];
  dependents: string[];
  trigger_conditions: AchievementTriggerCondition[];
  order: number;
}

/**
 * Hook for managing rewards and achievements
 */
export function useRewards() {
  const { dispatch } = useGame();

  /**
   * Claims a reward and updates game state
   * @param reward - Reward to claim
   */
  const claimReward = (reward: Reward) => {
    // Convert reward value to number if it's a string
    const claimPayload: RewardClaimPayload = {
      id: `reward_${Date.now()}`,
      type: reward.type as RewardType,
      value: typeof reward.value === 'string' ? parseInt(reward.value, 10) : reward.value,
      rarity: reward.rarity
    };

    dispatch({
      type: 'claim_reward',
      payload: claimPayload
    });

    // Check for legendary reward achievement
    if (reward.rarity === 'legendary') {
      const achievementPayload: AchievementUnlockPayload = {
        id: 'legendary_reward',
        title: 'Legendary Fortune',
        description: 'Claim a legendary reward',
        category: 'rewards',
        points: 100,
        rarity: 'legendary',
        unlocked: true,
        unlockedAt: new Date(),
        prerequisites: [],
        dependents: [],
        trigger_conditions: [{
          type: 'reward_rarity',
          value: 4,
          comparison: 'eq'
        }],
        order: 100
      };

      // Convert to Achievement type before dispatching
      const achievement: Achievement = {
        ...achievementPayload,
        trigger_conditions: achievementPayload.trigger_conditions.map(condition => ({
          type: condition.type,
          value: condition.value,
          comparison: condition.comparison,
          current: condition.value
        })) as AchievementTrigger[]
      };

      dispatch({
        type: 'UNLOCK_ACHIEVEMENTS',
        payload: [achievement]
      });
    }
  };

  /**
   * Checks if a reward can be claimed
   * @param reward - Reward to check
   * @returns boolean indicating if reward can be claimed
   */
  const canClaimReward = (reward: Reward): boolean => {
    // Add any claim validation logic here
    return true;
  };

  /**
   * Formats reward value for display
   * @param reward - Reward to format
   * @returns Formatted reward value string
   */
  const formatRewardValue = (reward: Reward): string => {
    if (typeof reward.value === 'string') {
      return reward.value;
    }
    return reward.value.toLocaleString();
  };

  return {
    claimReward,
    canClaimReward,
    formatRewardValue
  };
}

/**
 * Hook Dependencies:
 * - useGame: For dispatching state updates
 * - Achievement types: For achievement payloads
 * - Reward types: For reward handling
 * 
 * State Management:
 * - Dispatches to GameContext
 * - Handles reward claiming and achievement unlocks
 * 
 * Used By:
 * - DailyRewardSystem component
 * - LootBox component
 * - QuestRewards component
 * 
 * Features:
 * - Reward claiming
 * - Achievement unlocking
 * - Reward validation
 * - Value formatting
 * 
 * Scalability Considerations:
 * - Separate interfaces for payloads
 * - Type safety for all operations
 * - Modular reward handling
 * - Extensible validation system
 * - Proper type conversion for achievements
 */ 
