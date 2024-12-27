import type { 
  Quest, 
  QuestStatus, 
  QuestRequirement, 
  UserQuest 
} from '../../types/quests';
import type { Achievement } from '../../types/achievements';
import type { GameItem, InventoryItem } from '../../types/items';
import type { GameStatistics, GameState } from '../../types/game';
import type { 
  BattleQuestion, 
  BattleRewards, 
  BattleHistory, 
  BattleStatus, 
  BattleState, 
  BattleScore, 
  DBbattle_stats, 
  BotOpponent,
  BattlePhase
} from '../../types/battle';
import type { UserProgressQueryResult } from '../../types/progress';
import type { Reward } from '../../types/rewards';
import type { QuestRewards } from '../../types/quests';
import type { QuizStats } from '../../types/user';
import type { QuestProgress } from '../../types/quests';
import type { User } from '../../types/user';
import { Dispatch } from 'react';
import type { Card } from '../../utils/cardUtils';

export type GameDispatch = Dispatch<GameAction>;

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
  | { type: 'INITIALIZE_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<User> }
  | { type: 'ADD_XP'; payload: { amount: number } }
  | { type: 'ADD_COINS'; payload: { amount: number } }
  | { type: 'INITIALIZE_BATTLE'; payload: { player_role: 'promotoria' | 'defesa'; opponent: { is_bot: boolean; difficulty?: number } } }
  | { type: 'SET_BATTLE_STATUS'; payload: BattleStatus }
  | { type: 'PLAY_CARD'; payload: { playerCard: Card; opponentCard: Card } }
  | { type: 'UPDATE_BATTLE_PROGRESS'; payload: { playerCard?: Card; opponentCard?: Card; score: { player: number; opponent: number }; current_round: number; last_played_cards: { player: Card; opponent: Card } } }
  | { type: 'END_BATTLE'; payload: { status: BattleStatus; score: { player: number; opponent: number }; rewards: { xp_earned: number; coins_earned: number; streak_bonus: number; time_bonus: number } } }
  | { type: 'RESET_BATTLE' }
  | { type: 'UPDATE_USER_PROGRESS'; payload: { xp: number; coins: number; level: number; streak: number } }
  | { type: 'UNLOCK_ACHIEVEMENTS'; payload: any[] }
  | { type: 'UPDATE_QUESTS'; payload: { active: any[]; completed: any[] } }
  | { type: 'UPDATE_INVENTORY'; payload: { items: any[] } };

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



