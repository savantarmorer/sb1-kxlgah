import type { 
  Quest, 
  QuestStatus, 
  QuestRequirement, 
  UserQuest 
} from '../../types/quests';
import type { Achievement } from '../../types/achievements';
import type { GameItem, InventoryItem } from '../../types/items';
import type { GameStatistics, LeaderboardEntry } from '../../types/game';
import type { 
  BattleQuestion, 
  BattleRewards, 
  BattleHistory, 
  BattleStatus, 
  BattleState, 
  BattleScore, 
  DBbattle_stats, 
  BotOpponent
} from '../../types/battle';
import type { UserProgressQueryResult } from '../../types/progress';
import type { Reward } from '../../types/rewards';
import type { QuestRewards } from '../../types/quests';
import type { QuizStats } from '../../types/user';
import type { QuestProgress } from '../../types/quests';
import type { User } from '../../types/user';
import { Dispatch } from 'react';
import type { GameState } from '../../types/game';

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
  BattleHistory,
  GameState,
  BattleStatus,
  BattleState,
  BattleScore,
  GameStatistics,
  LeaderboardEntry,
  UserProgressQueryResult,
  QuestRewards,
  QuizStats,
  QuestProgress
};

export interface BattleProgressState {
  xp_gained: number;
  coins_earned: number;
  streak_bonus: number;
  time_bonus: number;
}

export interface GameContextType {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  loading: boolean;
  initialized: boolean;
  getCurrentQuestion: () => BattleQuestion | null;
  getBattleStatus: () => BattleStatus;
  getBattleProgress: () => {
    currentQuestion: number;
    totalQuestions: number;
    timeLeft: number;
    score: { player: number; opponent: number };
  };
  getRewards: () => {
    xpEarned: number;
    coinsEarned: number;
    streak_bonus: number;
    timeBonus: number;
  };
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

export interface DailyReward {
  reward_type: string;
  reward_value: number;
  rarity: string;
}

export type GameAction =
  | { type: 'RESET_BATTLE' }
  | { type: 'INITIALIZE_BATTLE'; payload: { questions: BattleQuestion[]; opponent: any; time_per_question?: number } }
  | { type: 'ANSWER_QUESTION'; payload: { answer: string; is_correct: boolean } }
  | { type: 'END_BATTLE'; payload: { status?: BattleStatus; score: BattleScore; rewards: BattleRewards } }
  | { type: 'SET_BATTLE_STATUS'; payload: BattleStatus }
  | { type: 'UPDATE_BATTLE_PROGRESS'; payload: Partial<BattleProgressState> }
  | { type: 'INITIALIZE_USER'; payload: User }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<User> }
  | { type: 'ADD_XP'; payload: XPGain }
  | { type: 'ADD_COINS'; payload: { amount: number; source: string } }
  | { type: 'UPDATE_USER_PROGRESS'; payload: { xp: number; coins: number; level: number; streak: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LEVEL_UP'; payload: { level: number; rewards: Reward[] } }
  | { type: 'UPDATE_INVENTORY'; payload: { items: InventoryItem[] } }
  | { type: 'UPDATE_USER_STATS'; payload: { quest_progress: Record<string, any> } } 
  | { type: 'UPDATE_BATTLE_HISTORY'; payload: { battle_history: BattleHistory[] } } 
  | { type: 'UPDATE_BATTLE_REWARDS'; payload: { rewards: BattleRewards } } 
  | { type: 'UPDATE_BATTLE_SCORE'; payload: { score: BattleScore } } 
  | { type: 'UPDATE_BATTLE_STATE'; payload: { state: BattleState } } 
  | { type: 'UPDATE_BATTLE_STATUS'; payload: { status: BattleStatus } } 
  | { type: 'UPDATE_BATTLE_QUESTION'; payload: { question: BattleQuestion } } 
  | { type: 'UPDATE_BATTLE_QUESTION_INDEX'; payload: { index: number } } 
  | { type: 'UPDATE_BATTLE_TIME_LEFT'; payload: { time_left: number } } 
  | { type: 'UPDATE_BATTLE_QUESTION_ANSWERED'; payload: { answered: boolean } } 
  | { type: 'UPDATE_BATTLE_QUESTION_CORRECT'; payload: { correct: boolean } };

/**
 * Role: Define all possible game state actions
 * Dependencies:
 * - All game state types
 * - Battle types
 * - Inventory types
 * 
 * Used by:
 * - Game reducer
 * - Game context
 * - All game components
 * 
 * Features:
 * - Type-safe action handling
 * - Complete game state mutations
 * - Battle system integration
 * - Inventory management
 */

// Re-export action types
export type { AchievementAction } from './actions';
export type { UserStatsAction } from './actions';
export type { QuestAction } from './actions';
export type { UserAction } from './actions';
export type { SystemAction } from './actions';



