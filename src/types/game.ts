import { Achievement } from './achievements';
import { BattleState, DBbattle_stats } from './battle';
import { Quest } from './quests';
import { InventoryItem } from './items';
import { Reward } from './rewards';
import { User } from './user';

export interface GameStatistics {
  items: any[];
  login_history: any[];
  recentXPGains: any[];
  leaderboard: any[];
  statistics: any;
  syncing: boolean;
  debugMode: boolean;
  lastLevelUpRewards: any[];
  activeUsers: number;
  completedQuests: number;
  purchasedItems: number;
  battlesPlayed: number;
  battlesWon: number;
  averageScore: number;
  lastUpdated: string;
  recentActivity: any[];
}

export interface GameState {
  loading: boolean;
  user: User;
  battle?: BattleState;
  battle_stats: DBbattle_stats;
  achievements: Achievement[];
  quests: {
    active: Quest[];
    completed: Quest[];
  };
  completedQuests: string[];
  items: InventoryItem[];
  statistics: GameStatistics;
  syncing: boolean;
  debugMode: boolean;
  lastLevelUpRewards: Reward[];
  login_history: any[];
  recentXPGains: any[];
  leaderboard: any[];
  study_time: number;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  score: number;
  rank: number;
  avatar?: string;
  level: number;
}