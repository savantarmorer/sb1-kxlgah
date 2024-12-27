export interface BattleResolutionProps {
  rewards: BattleRewards;
  // ...
}

export interface BattleRewards {
  xp_earned: number;
  coins_earned: number;
  streak_bonus: number;
  time_bonus: number;
  total_xp: number;
  total_coins: number;
  metadata?: Record<string, any>;
}

export function BattleResolution({ rewards }: BattleResolutionProps) {
  return {
    total_xp: rewards.xp_earned,
    total_coins: rewards.coins_earned,
    // ...
  };
} 