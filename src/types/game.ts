import { User } from './user';
import { Achievement } from './achievements';
import { Quest } from './quests';
import { BattleState, BattleStats } from './battle';
import { Reward } from './rewards';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  rank: number;
}

export interface GameStatistics {
  activeUsers: number;
  completedQuests: number;
  purchasedItems: number;
  battlesPlayed: number;
  battlesWon: number;
  averageScore: number;
  lastUpdated: string;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
    value?: number;
  }>;
}

export interface GameState {
  user: User;
  battle: BattleState;
  battleStats: BattleStats;
  battleRating?: number;
  achievements: Achievement[];
  quests: Quest[];
  completedQuests: string[];
  items: any[];
  loginHistory: string[];
  recentXPGains: Array<{
    amount: number;
    reason: string;
    timestamp: string;
    isCritical: boolean;
  }>;
  leaderboard: LeaderboardEntry[];
  statistics: GameStatistics;
  syncing: boolean;
  debugMode: boolean;
}