import { User } from './user';
import { Achievement } from './achievements';
import { Quest } from './quests';
import { BattleState, DBbattle_stats, BattleRatings } from './battle';
import { Reward } from './rewards';
import { InventoryItem } from './items';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  rank: number;
}

export interface XPGain {
  amount: number;
  timestamp: string | number;
  reason?: string;
  source?: string;
}

export interface ActivityEntry {
  type: string;
  description: string;
  timestamp: Date;
  value?: number;
}

export interface GameStatistics {
  activeUsers: number;
  completedQuests: number;
  purchasedItems: number;
  battlesPlayed: number;
  battlesWon: number;
  averageScore: number;
  lastUpdated: string;
  recentActivity: any[];
  items: any[];
  login_history: any[];
  recentXPGains: any[];
  leaderboard: any[];
  statistics: GameStatistics | null;
  syncing: boolean;
  debugMode: boolean;
  lastLevelUpRewards: any[];
}

export interface QuestState {
  active: Quest[];
  completed: Quest[];
}

interface GameState {
  user: User & {
    rewardMultipliers: Record<string, number>;
    constitutionalScore: number;
    civilScore: number;
    criminalScore: number;
    administrativeScore: number;
  };
  battle: BattleState;
  battle_stats: DBbattle_stats;
  quests: {
    active: Quest[];
    completed: Quest[];
  };
  battleRatings: BattleRatings;
  achievements: Achievement[];
  completedQuests: string[];
  items: any[];
  login_history: Array<{
    timestamp: string;
    device?: string;
  }>;
  recentXPGains: Array<{
    amount: number;
    timestamp: string;
  }>;
  leaderboard: {
    rank?: number;
    score: number;
    updated_at: string;
  };
  statistics: GameStatistics;
  syncing: boolean;
  debugMode: boolean;
  lastLevelUpRewards: Reward[];
  lastReward?: {
    xp: number;
    coins: number;
  };
}

export type { GameState };

/**
 * Game State Documentation
 * 
 * Core state management interface for the game:
 * @property user - User profile and progress data
 * @property battle - Current battle state and progress
 * @property statistics - Overall game statistics
 * @property syncing - Flag for data synchronization
 * @property debugMode - Toggle for debug features
 * @property lastLevelUpRewards - Most recent level-up rewards for UI feedback
 * 
 * Integration Points:
 * - Used by GameContext for state management
 * - Consumed by UI components for display
 * - Updated through game actions
 */