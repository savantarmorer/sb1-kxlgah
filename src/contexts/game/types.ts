import type { 
  Quest, 
  QuestStatus, 
  QuestRequirement, 
  UserQuest 
} from '../../types/quests';
import type { Achievement } from '../../types/achievements';
import type { GameItem, InventoryItem } from '../../types/items';
import type { GameStatistics } from '../../types/game';
import type { BattleQuestion, BattleRewards, BattleHistory, BattleStatus, BattleState } from '../../types/battle';
import type { LeaderboardEntry } from '../../types/game';
import type { BotOpponent } from '../../types/battle';
import type { UserProgressQueryResult } from '../../types/progress';
import type { Reward } from '../../types/rewards';
import type { QuestRewards } from '../../types/quests';
import type { QuizStats } from '../../types/user';

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
  | { type: 'INITIALIZE_BATTLE'; payload: { questions: BattleQuestion[]; timePerQuestion: number; difficulty?: number; is_bot?: boolean } }
  | { type: 'ANSWER_QUESTION'; payload: { isCorrect: boolean; timeSpent: number; answer: number } }
  | { type: 'END_BATTLE'; payload: { victory: boolean; rewards: BattleRewards; stats: Partial<battle_stats> } }
  | { type: 'SET_BATTLE_ERROR'; payload: { message: string; code?: string } }
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
  | { type: 'INITIALIZE_BATTLE'; payload: { questions: BattleQuestion[]; time_per_question: number; opponent: BotOpponent } }
  | { type: 'ANSWER_QUESTION'; payload: { isCorrect: boolean } }
  | { type: 'END_BATTLE'; payload: { status: BattleStatus; score: { player: number; opponent: number }; rewards: BattleRewards } }
  | { type: 'RESET_BATTLE' }
  | { type: 'SET_BATTLE_STATUS'; payload: BattleStatus }
  | { type: 'UPDATE_BATTLE_SCORE'; payload: { player: number; opponent: number; is_correct: boolean } }
  | { type: 'NEXT_BATTLE_QUESTION'; payload: null }
  | { type: 'UPDATE_BATTLE_PROGRESS'; payload: { playerScore: number; opponentScore: number; currentQuestion: number; timeLeft: number; isCorrect: boolean } }
  | { type: 'UPDATE_BATTLE_STATS'; payload: Partial<battle_stats> }

  // User Actions
  | { type: 'UPDATE_USER_STATS'; payload: { xp: number; coins: number; streak: number } }
  | { type: 'UPDATE_USER_PROGRESS'; payload: UserProgressQueryResult }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<User> }
  | { type: 'ADD_XP'; payload: XPGain }
  | { type: 'ADD_COINS'; payload: { amount: number; source: string } }
  | { type: 'LEVEL_UP'; payload: LevelUpReward }
  | { type: 'CLAIM_REWARD'; payload: Reward }
  | { type: 'UPDATE_STREAK_MULTIPLIER'; payload: number }
  | { type: 'UPDATE_DAILY_STREAK'; payload: { streak: number; multiplier: number } }
  | { type: 'UPDATE_STUDY_TIME'; payload: { today: number } }
  | { type: 'UPDATE_LOGIN_STREAK'; payload: { streak: number; last_login_date?: string } }

  // Quest Actions
  | { type: 'UPDATE_QUEST_PROGRESS'; payload: { questId: string; progress: number } }
  | { type: 'UPDATE_QUEST'; payload: Quest }
  | { type: 'UPDATE_QUESTS'; payload: { active: Quest[]; completed: Quest[] } }
  | { type: 'COMPLETE_QUEST'; payload: { quest: Quest; rewards: { xp: number; coins: number; items?: InventoryItem[] } } }

  // Item Actions
  | { type: 'UPDATE_INVENTORY'; payload: InventoryItem[] }
  | { type: 'UPDATE_ITEM'; payload: GameItem }
  | { type: 'ADD_ITEM'; payload: GameItem }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'PURCHASE_ITEM'; payload: { item_id: string; cost: number } }
  | { type: 'SYNC_ITEMS'; payload: GameItem[] }

  // Achievement Actions
  | { type: 'ADD_ACHIEVEMENT'; payload: Achievement }
  | { type: 'UPDATE_ACHIEVEMENT'; payload: Partial<Achievement> }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: Achievement }

  // System Actions
  | { type: 'UPDATE_QUIZ_STATS'; payload: any }
  | { type: 'SYNC_STATISTICS'; payload: GameStatistics }
  | { type: 'CLAIM_DAILY_REWARD'; payload: { reward_value: number; reward_type: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'INITIALIZE_USER'; payload: GameState['user'] }
  | { type: 'INITIALIZE_QUESTS'; payload: Quest[] }
  | { type: 'EQUIP_ITEM'; payload: { item_id: string } }
  | { type: 'UNEQUIP_ITEM'; payload: { item_id: string } }

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
  timestamp?: string;
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
    current: number;
    best: number;
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
