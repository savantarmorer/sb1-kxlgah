import type { 
  Quest, 
  QuestStatus, 
  QuestRequirement, 
  UserQuest 
} from '../../types/quests';
import type { Achievement } from '../../types/achievements';
import type { GameItem, InventoryItem } from '../../types/items';
import type { GameStatistics, LeaderboardEntry } from '../../types/game';
import type { BattleQuestion, BattleRewards, BattleHistory, BattleStatus, BattleState } from '../../types/battle';
import type { BotOpponent } from '../../types/battle';
import type { UserProgressQueryResult } from '../../types/progress';
import type { Reward } from '../../types/rewards';
import type { QuestRewards } from '../../types/quests';
import type { QuizStats } from '../../types/user';
import { Dispatch } from 'react';

export type {
  Quest,
  QuestStatus,
  QuestRequirement,
  UserQuest,
  Achievement,
  GameItem,
  InventoryItem,
  BattleQuestion,
  BattleRewards,
  BattleHistory
};

export type BattleAction =
  | { type: 'INITIALIZE_BATTLE'; payload: BattleState }
  | { type: 'END_BATTLE'; payload: { victory: boolean; score: number } }
  | { type: 'UPDATE_BATTLE_SCORE'; payload: number }
  | { type: 'RESET_BATTLE' };

/**
 * Game Action Types
 * Defines all possible actions that can modify the game state
 * 
 * Dependencies:
 * - All game type interfaces (User, Battle, Quest, etc.)
 * - Used by all reducers and action creators
 * 
 * Integration Points:
 * - GameContext dispatch function
 * - All game reducers
 * - Admin actions
 * - Battle system
 * 
 * Design Principles:
 * - Consistent uppercase naming for action types
 * - Type-safe payloads
 * - Clear separation of concerns
 */
export type GameAction =
  // Battle Actions
  | { type: 'RESET_BATTLE' }
  | { type: 'INITIALIZE_BATTLE'; payload: { questions: BattleQuestion[]; opponent: BotOpponent } }
  | { type: 'ANSWER_QUESTION'; payload: { answer: string; is_correct: boolean } }
  | { type: 'END_BATTLE'; payload: { rewards: BattleRewards } }
  | { type: 'SET_BATTLE_STATUS'; payload: BattleStatus }
  | { type: 'UPDATE_BATTLE_SCORE'; payload: { player: number; opponent: number } }
  | { type: 'NEXT_BATTLE_QUESTION' }
  | { type: 'UPDATE_BATTLE_PROGRESS'; payload: { in_progress: boolean } }

  // Achievement Actions
  | { type: 'INITIALIZE_ACHIEVEMENTS'; payload: Achievement[] }
  | { type: 'UNLOCK_ACHIEVEMENTS'; payload: Achievement[] }
  | { type: 'UPDATE_ACHIEVEMENT'; payload: Partial<Achievement> }
  | { type: 'ADD_ACHIEVEMENT'; payload: Achievement }

  // Quest Actions
  | { type: 'INITIALIZE_QUESTS'; payload: { active: Quest[]; completed: Quest[] } }
  | { type: 'UPDATE_QUEST_PROGRESS'; payload: { questId: string; progress: number } }
  | { type: 'COMPLETE_QUEST'; payload: { quest: Quest; rewards: Reward } }
  | { type: 'SYNC_QUESTS'; payload: Quest[] }

  // User Actions
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<User> }
  | { type: 'UPDATE_USER_STATS'; payload: { xp: number; coins: number; streak: number } }
  | { type: 'ADD_XP'; payload: { amount: number; source: string; reason?: string } }
  | { type: 'ADD_COINS'; payload: { amount: number; source: string } }
  | { type: 'CLAIM_REWARD'; payload: Reward }
  | { type: 'UPDATE_STREAK'; payload: { streak: number; highestStreak: number } }
  | { type: 'UPDATE_DAILY_STREAK'; payload: { streak: number; multiplier: number } }
  | { type: 'LEVEL_UP'; payload: { level: number; rewards: Reward[] } }

  // Inventory Actions
  | { type: 'EQUIP_ITEM'; payload: { item_id: string } }
  | { type: 'UNEQUIP_ITEM'; payload: { item_id: string } }
  | { type: 'UPDATE_ITEM'; payload: InventoryItem }
  | { type: 'ADD_ITEM'; payload: InventoryItem }
  | { type: 'UPDATE_INVENTORY'; payload: { items: InventoryItem[] } }

  // System Actions
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }

  // Add missing actions
  | { type: 'INITIALIZE_USER'; payload: User }
  | { type: 'UPDATE_QUESTS'; payload: Quest[] }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: Achievement }
  | { type: 'UPDATE_USER_PROGRESS'; payload: Required<Pick<User, 'xp' | 'level' | 'coins' | 'streak'>> }
  | { type: 'HANDLE_QUEST_COMPLETION'; payload: { quest: Quest; dispatch: Dispatch<GameAction> } };

export interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  checkAchievements: () => Promise<void>;
  handleXPGain: (xpGain: XPGain) => Promise<void>;
  handleCoinTransaction: (params: { amount: number; source: string }) => Promise<void>;
  handleItemTransaction: (
    item: GameItem,
    quantity: number,
    type: 'purchase' | 'reward' | 'use',
    cost: number
  ) => Promise<void>;
  useItemEffect: (item_id: string) => Promise<void>;
  handleQuestProgress: (
    quest: Quest,
    requirement: QuestRequirement,
    progress: number
  ) => void;
  handle_error: (error: unknown) => void;
}

export interface XPGain {
  amount: number;
  source: string;
  reason?: string;
  timestamp?: string;
  details?: {
    quest_id?: string;
    battle_id?: string;
    achievement_id?: string;
  };
}

export interface LevelUpReward {
  level: number;
  rewards: {
    xp: number;
    coins: number;
  };
}

/**
 * Role: Defines all possible actions in the game system
 * Dependencies:
 * - All game type interfaces
 * - Battle system
 * - Quest system
 * - Item system
 * Used by:
 * - Game reducer
 * - Admin actions
 * - Game actions
 * Features:
 * - Consistent lowercase naming
 * - Type-safe payloads
 * - Comprehensive coverage
 */

interface DailyReward {
  day: number;
  reward_type: string;
  reward_value: number;
  rarity: string;
}

export interface GameState {
  user: {
    id: string;
    name: string;
    email: string;
    level: number;
    xp: number;
    coins: number;
    streak: number;
    avatar: string;
    avatarFrame: string;
    battle_rating: number;
    achievements: Achievement[];
    inventory: InventoryItem[];
    backpack: InventoryItem[];
    roles: string[];
    study_time: number;
    constitutionalScore: number;
    civilScore: number;
    criminalScore: number;
    administrativeScore: number;
    last_login_date?: string;
    daily_rewards?: {
      claimed_today: boolean;
      streak: number;
      streak_multiplier: number;
      next_reward?: DailyReward;
    };
    battle_stats?: battle_stats;
    streakMultiplier?: number;
    quiz_stats?: {
      total_questions: number;
      correct_answers: number;
      accuracy: number;
      average_time: number;
      completed_quizzes: number;
      streak: number;
    };
    rewardMultipliers: {
      xp: number;
      coins: number;
    };
    login_streak?: {
      current: number;
      best: number;
      last_login: string;
    };
  };
  battle?: BattleState;
  battle_stats: battle_stats;
  battleRatings: {
    user_id: string;
    rating: number;
    wins: number;
    losses: number;
    streak: number;
    highest_streak: number;
    updated_at: string;
  };
  quests: {
    active: Quest[];
    completed: Quest[];
  };
  achievements: Achievement[];
  completedQuests: string[];
  items: GameItem[];
  login_history: string[];
  recentXPGains: XPGain[];
  leaderboard: LeaderboardEntry[];
  statistics: GameStatistics;
  syncing: boolean;
  debugMode: boolean;
  lastReward?: {
    xp: number;
    coins: number;
  };
  lastLevelUpRewards: Reward[];
}

/**
 * Core user interface representing player state
 * 
 * Dependencies:
 * - Used by AuthContext for user management
 * - Used by GameContext for game state
 * - Used by UI components for display
 * 
 * Integration Points:
 * - Profile system
 * - Battle system
 * - Achievement system
 * - Quest system
 */
export interface User {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  avatar: string;
  avatarFrame: string;
  battle_rating: number;
  achievements: Achievement[];
  inventory: InventoryItem[];
  backpack: InventoryItem[];
  roles: string[];
  study_time: number;
  constitutionalScore: number;
  civilScore: number;
  criminalScore: number;
  administrativeScore: number;
  last_login_date?: string;
  rewardMultipliers: {
    xp: number;
    coins: number;
  };
  battle_stats?: battle_stats;
  streakMultiplier?: number;
  quiz_stats?: QuizStats;
  login_streak?: {
    count: number;
    last_login: string;
  };
}

/**
 * Base battle statistics interface
 * Used for tracking player battle performance and progress
 */
export interface battle_stats {
  user_id: string;
  total_battles: number;
  wins: number;
  losses: number;
  win_streak: number;
  highest_streak: number;
  total_xp_earned: number;
  total_coins_earned: number;
  difficulty: number;
  updated_at: string;
}

// Achievement-related actions
export type AchievementAction = 
  | { type: 'SYNC_ACHIEVEMENTS'; payload: Achievement[] }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: Achievement | Achievement[] }
  | { type: 'UPDATE_ACHIEVEMENT'; payload: { id: string; progress: number } };

// User stats update action
export type UserStatsAction = {
  type: 'UPDATE_USER_STATS';
  payload: {
    xp: number;
    coins: number;
    streak: number;
  };
};

interface UserStats {
  xp: number;
  coins: number;
  streak: number;
  quest_progress: Record<string, QuestProgress>;
}



