export interface BattleRewards {
  xpEarned: number;
  coinsEarned: number;
  streakBonus: number;
  timeBonus: number;
  totalXp: number;
  totalCoins: number;
  metadata?: Record<string, any>;
} 