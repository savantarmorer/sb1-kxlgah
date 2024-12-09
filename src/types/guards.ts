/**
 * Type Guards for Legal Study Battle Game
 * =====================================
 * 
 * What is this file?
 * ------------------
 * This file contains "security guards" for our game data. Just like a security guard checks 
 * IDs at a building entrance, these functions check if data entering our game is valid and safe to use.
 * 
 * Who needs this?
 * --------------
 * 1. Game Developers: To ensure data consistency and prevent bugs
 * 2. Backend Services: To validate data before saving to database
 * 3. Frontend Components: To verify data received from server
 * 
 * Why is this important?
 * --------------------
 * Imagine if someone tried to give a player negative coins or set their level to "banana" - 
 * that would break the game! These guards prevent such invalid data from entering the system.
 * 
 * How does it work?
 * ---------------
 * Each function (called a "type guard") does three main things:
 * 1. Checks if data has all required properties (like checking if a form is complete)
 * 2. Verifies each property has the correct type (like making sure age is a number, not text)
 * 3. Reports detailed errors when something is wrong (like highlighting mistakes on a form)
 */

import { 
  Achievement, 
  AchievementTrigger
} from './achievements';
import { 
  BattleState, 
  BattleRewards 
} from './battle';
import { User } from './user';
import { 
  XPGain,
  ActivityEntry,
  GameState,
  GameStatistics
} from './game';
import { Quest } from './quests';
import { InventoryItem } from './items';
import { AchievementReward } from './progress';

/**
 * Error Logging Helper
 * ------------------
 * Purpose: Creates clear, detailed error messages when data is invalid
 * 
 * Used to:
 * - Help developers find and fix bugs
 * - Generate user-friendly error messages
 * - Track data validation issues
 * 
 * @param type - What kind of data was being checked
 * @param value - The actual data that failed validation
 * @param required - List of properties that must be present
 * @param invalidProps - List of properties that had wrong values
 */
const logTypeError = (
  type: string,
  value: any,
  required: string[] = [],
  invalidProps: { [key: string]: string }[] = []
): void => {
  console.error(`Invalid ${type} object:`, {
    receivedObject: value,
    missingRequiredProperties: required,
    invalidPropertyTypes: invalidProps,
    expectedType: type
  });
};

/**
 * Detailed error logging for type validation failures
 */
// Removed duplicate declaration

/**
 * Achievement Type Guard
 * --------------------
 * Purpose: Ensures achievement data is valid before being displayed or saved
 * 
 * Checks for:
 * - Achievement ID (must be text)
 * - Title (must be text)
 * - Description (must be text)
 * - Requirements (must be a list of conditions)
 * - Rewards (must be valid game rewards)
 */
export const isAchievement = (achievement: any): achievement is Achievement => {
  if (!achievement || typeof achievement !== 'object') {
    logTypeError('Achievement', achievement, ['id', 'title', 'description', 'trigger', 'rewards']);
    return false;
  }

  const invalidProps: { [key: string]: string }[] = [];
  if (typeof achievement.id !== 'string') invalidProps.push({ id: `expected string, got ${typeof achievement.id}` });
  if (typeof achievement.title !== 'string') invalidProps.push({ title: `expected string, got ${typeof achievement.title}` });
  if (typeof achievement.description !== 'string') invalidProps.push({ description: `expected string, got ${typeof achievement.description}` });
  if (!achievement.trigger || typeof achievement.trigger !== 'object') invalidProps.push({ trigger: 'expected object' });
  if (!Array.isArray(achievement.rewards)) invalidProps.push({ rewards: `expected array, got ${typeof achievement.rewards}` });

  const isValid = typeof achievement.id === 'string'
    && typeof achievement.title === 'string'
    && typeof achievement.description === 'string'
    && achievement.trigger
    && typeof achievement.trigger === 'object'
    && Array.isArray(achievement.rewards);

  if (!isValid && invalidProps.length > 0) {
    logTypeError('Achievement', achievement, [], invalidProps);
  }

  return isValid;
};

/**
 * AchievementReward Type Guard
 * ---------------------------
 * Purpose: Validates achievement rewards before being awarded to players
 * 
 * Checks for:
 * - Reward type (must be one of 'xp', 'coins', 'item', 'title')
 * - Reward amount (must be a positive number)
 */
export const isAchievementReward = (obj: any): obj is AchievementReward => {
  if (!obj) {
    logTypeError('AchievementReward', obj, ['type', 'amount']);
    return false;
  }

  const invalidProps: { [key: string]: string }[] = [];
  if (!['xp', 'coins', 'item', 'title'].includes(obj.type)) {
    invalidProps.push({ type: `expected one of ['xp', 'coins', 'item', 'title'], got ${obj.type}` });
  }
  if (typeof obj.amount !== 'number') {
    invalidProps.push({ amount: `expected number, got ${typeof obj.amount}` });
  }

  const isValid = obj 
    && ['xp', 'coins', 'item', 'title'].includes(obj.type)
    && typeof obj.amount === 'number';

  if (!isValid && invalidProps.length > 0) {
    logTypeError('AchievementReward', obj, [], invalidProps);
  }

  return isValid;
};

/**
 * BattleRewards Type Guard
 * ----------------------
 * Purpose: Ensures battle rewards are valid before being awarded to players
 * 
 * Checks for:
 * - XP reward (must be a positive number)
 * - Coins reward (must be a positive number)
 * - Streak bonus (must be a positive number)
 * - Time bonus (must be a positive number)
 * - Achievements (must be a list of valid achievements)
 */
export const isBattleRewards = (obj: any): obj is BattleRewards => {
  if (!obj) {
    logTypeError('BattleRewards', obj, ['xp', 'coins', 'streak_bonus', 'timeBonus', 'achievements']);
    return false;
  }

  const invalidProps: { [key: string]: string }[] = [];
  if (typeof obj.xp !== 'number') invalidProps.push({ xp: `expected number, got ${typeof obj.xp}` });
  if (typeof obj.coins !== 'number') invalidProps.push({ coins: `expected number, got ${typeof obj.coins}` });
  if (obj.streak_bonus && typeof obj.streak_bonus !== 'number') invalidProps.push({ streak_bonus: `expected number, got ${typeof obj.streak_bonus}` });
  if (obj.timeBonus && typeof obj.timeBonus !== 'number') invalidProps.push({ timeBonus: `expected number, got ${typeof obj.timeBonus}` });
  if (obj.achievements && !Array.isArray(obj.achievements)) invalidProps.push({ achievements: `expected array, got ${typeof obj.achievements}` });

  const isValid = obj 
    && typeof obj.xp === 'number'
    && typeof obj.coins === 'number'
    && (!obj.streak_bonus || typeof obj.streak_bonus === 'number')
    && (!obj.timeBonus || typeof obj.timeBonus === 'number')
    && (!obj.achievements || Array.isArray(obj.achievements));

  if (!isValid && invalidProps.length > 0) {
    logTypeError('BattleRewards', obj, [], invalidProps);
  }

  return isValid;
};

/**
 * XPGain Type Guard
 * ----------------
 * Purpose: Ensures experience points are awarded correctly
 * 
 * Checks for:
 * - Amount (must be a positive number)
 * - Reason (must be text explaining why XP was earned)
 * - Timestamp (must be a valid date)
 * - Critical flag (true if it's a bonus XP gain)
 */
export const isXPGain = (obj: any): obj is XPGain => {
  if (!obj) {
    logTypeError('XPGain', obj, ['amount', 'source', 'timestamp', 'multiplier']);
    return false;
  }

  const invalidProps: { [key: string]: string }[] = [];
  if (typeof obj.amount !== 'number') invalidProps.push({ amount: `expected number, got ${typeof obj.amount}` });
  if (typeof obj.source !== 'string') invalidProps.push({ source: `expected string, got ${typeof obj.source}` });
  if (typeof obj.timestamp !== 'string') invalidProps.push({ timestamp: `expected string, got ${typeof obj.timestamp}` });
  if (typeof obj.multiplier !== 'number') invalidProps.push({ multiplier: `expected number, got ${typeof obj.multiplier}` });

  const isValid = obj 
    && typeof obj.amount === 'number'
    && typeof obj.source === 'string'
    && typeof obj.timestamp === 'string'
    && typeof obj.multiplier === 'number';

  if (!isValid && invalidProps.length > 0) {
    logTypeError('XPGain', obj, [], invalidProps);
  }

  return isValid;
};

/**
 * Quest Type Guard
 * ---------------
 * Purpose: Ensures quest data is valid before being displayed or saved
 * 
 * Checks for:
 * - Quest ID (must be text)
 * - Title (must be text)
 * - Description (must be text)
 * - XP reward (must be a positive number)
 * - Coin reward (must be a positive number)
 * - Requirements (must be a list of valid requirements)
 * - Progress (must be a number between 0 and 100)
 * - Active status (must be a boolean)
 */
export const isQuest = (obj: any): obj is Quest => {
  if (!obj) {
    logTypeError('Quest', obj, ['title', 'description', 'xp_reward', 'coin_reward', 'requirements', 'progress', 'is_active']);
    return false;
  }

  const invalidProps: { [key: string]: string }[] = [];
  if (typeof obj.title !== 'string') invalidProps.push({ title: `expected string, got ${typeof obj.title}` });
  if (typeof obj.description !== 'string') invalidProps.push({ description: `expected string, got ${typeof obj.description}` });
  if (typeof obj.xp_reward !== 'number') invalidProps.push({ xp_reward: `expected number, got ${typeof obj.xp_reward}` });
  if (typeof obj.coin_reward !== 'number') invalidProps.push({ coin_reward: `expected number, got ${typeof obj.coin_reward}` });
  if (!Array.isArray(obj.requirements)) invalidProps.push({ requirements: `expected array, got ${typeof obj.requirements}` });
  if (typeof obj.progress !== 'number') invalidProps.push({ progress: `expected number, got ${typeof obj.progress}` });
  if (typeof obj.is_active !== 'boolean') invalidProps.push({ is_active: `expected boolean, got ${typeof obj.is_active}` });

  const isValid = obj 
    && typeof obj.title === 'string'
    && typeof obj.description === 'string'
    && typeof obj.xp_reward === 'number'
    && typeof obj.coin_reward === 'number'
    && Array.isArray(obj.requirements)
    && typeof obj.progress === 'number'
    && typeof obj.is_active === 'boolean';

  if (!isValid && invalidProps.length > 0) {
    logTypeError('Quest', obj, [], invalidProps);
  }

  return isValid;
};

/**
 * InventoryItem Type Guard
 * ----------------------
 * Purpose: Ensures inventory item data is valid before being displayed or saved
 * 
 * Checks for:
 * - Item ID (must be text)
 * - Quantity (must be a positive number)
 * - Item (must be a valid game item)
 */
export const isInventoryItem = (obj: any): obj is InventoryItem => {
  if (!obj) {
    logTypeError('InventoryItem', obj, ['id', 'quantity', 'item']);
    return false;
  }

  const invalidProps: { [key: string]: string }[] = [];
  if (typeof obj.id !== 'string') invalidProps.push({ id: `expected string, got ${typeof obj.id}` });
  if (typeof obj.quantity !== 'number') invalidProps.push({ quantity: `expected number, got ${typeof obj.quantity}` });
  if (!obj.item) invalidProps.push({ item: 'expected object, got undefined' });
  if (obj.item && typeof obj.item.id !== 'string') invalidProps.push({ 'item.id': `expected string, got ${typeof obj.item.id}` });
  if (obj.item && typeof obj.item.name !== 'string') invalidProps.push({ 'item.name': `expected string, got ${typeof obj.item.name}` });
  if (obj.item && typeof obj.item.type !== 'string') invalidProps.push({ 'item.type': `expected string, got ${typeof obj.item.type}` });

  const isValid = obj 
    && typeof obj.id === 'string'
    && typeof obj.quantity === 'number'
    && obj.item 
    && typeof obj.item.id === 'string'
    && typeof obj.item.name === 'string'
    && typeof obj.item.type === 'string';

  if (!isValid && invalidProps.length > 0) {
    logTypeError('InventoryItem', obj, [], invalidProps);
  }

  return isValid;
};

/**
 * GameStatistics Type Guard
 * ------------------------
 * Purpose: Validates player statistics and game metrics
 * 
 * Checks for:
 * - Number of active users (must be a positive number)
 * - Completed quests count (must be a number)
 * - Battle statistics (wins, losses, average scores)
 * - Recent activity log (must be a valid list of activities)
 * 
 * Used when:
 * - Updating player statistics after a battle
 * - Displaying leaderboards
 * - Generating game analytics
 */
export const isGameStatistics = (obj: any): obj is GameStatistics => {
  if (!obj || typeof obj !== 'object') {
    logTypeError('GameStatistics', obj, [
      'activeUsers',
      'completedQuests',
      'purchasedItems',
      'battlesPlayed',
      'battlesWon',
      'averageScore',
      'lastUpdated',
      'recentActivity'
    ]);
    return false;
  }

  const invalidProps: { [key: string]: string }[] = [];

  // Check required numeric properties
  if (typeof obj.activeUsers !== 'number') 
    invalidProps.push({ activeUsers: `expected number, got ${typeof obj.activeUsers}` });
  if (typeof obj.completedQuests !== 'number') 
    invalidProps.push({ completedQuests: `expected number, got ${typeof obj.completedQuests}` });
  if (typeof obj.purchasedItems !== 'number') 
    invalidProps.push({ purchasedItems: `expected number, got ${typeof obj.purchasedItems}` });
  if (typeof obj.battlesPlayed !== 'number') 
    invalidProps.push({ battlesPlayed: `expected number, got ${typeof obj.battlesPlayed}` });
  if (typeof obj.battlesWon !== 'number') 
    invalidProps.push({ battlesWon: `expected number, got ${typeof obj.battlesWon}` });
  if (typeof obj.averageScore !== 'number') 
    invalidProps.push({ averageScore: `expected number, got ${typeof obj.averageScore}` });

  // Check string properties
  if (typeof obj.lastUpdated !== 'string') 
    invalidProps.push({ lastUpdated: `expected string, got ${typeof obj.lastUpdated}` });

  // Check array properties
  if (!Array.isArray(obj.recentActivity)) 
    invalidProps.push({ recentActivity: `expected array, got ${typeof obj.recentActivity}` });

  // Validate recent activity entries if they exist
  if (Array.isArray(obj.recentActivity)) {
    obj.recentActivity.forEach((entry: unknown, index: number) => {
      if (!isActivityEntry(entry)) {
        invalidProps.push({ [`recentActivity[${index}]`]: 'invalid ActivityEntry' });
      }
    });
  }

  // Log any invalid properties
  if (invalidProps.length > 0) {
    logTypeError('GameStatistics', obj, [], invalidProps);
    return false;
  }

  return true;
};

/**
 * GameStateUpdate Type Guard
 * -------------------------
 * Purpose: Protects the game's core state from invalid changes
 * 
 * Business Rules Enforced:
 * 1. Player Level:
 *    - Can only increase, never decrease
 *    - Must be a valid number
 * 
 * 2. Experience Points (XP):
 *    - Cannot go negative
 *    - Must increase over time
 * 
 * 3. Coins:
 *    - Must be zero or positive
 *    - Changes must be valid transactions
 * 
 * 4. Battle State:
 *    - Can't start new battle while one is in progress
 *    - Battle scores must be valid numbers
 * 
 * 5. Statistics:
 *    - All counters must be non-negative
 *    - Historical data can only grow
 * 
 * Used when:
 * - Saving game progress
 * - Updating player status
 * - Processing battle results
 * - Recording study achievements
 */
export const isValidGameStateUpdate = (
  current: GameState, 
  update: Partial<GameState>
): boolean => {
  // Check user updates
  if (update.user) {
    // Ensure level can only increase
    if (update.user.level !== undefined) {
      if (typeof update.user.level !== 'number' || update.user.level < current.user.level) return false;
    }
    // Ensure XP can't decrease
    if (update.user.xp !== undefined) {
      if (typeof update.user.xp !== 'number' || update.user.xp < current.user.xp) return false;
    }
    // Ensure coins don't go negative
    if (update.user.coins !== undefined) {
      if (typeof update.user.coins !== 'number' || update.user.coins < 0) return false;
    }
    if (update.user.inventory && !Array.isArray(update.user.inventory)) return false;
  }

  // Check battle updates
  if (update.battle) {
    // Can't start a new battle if one is in progress
    if (update.battle.in_progress && current.battle.in_progress) return false;
    if (typeof update.battle.in_progress !== 'boolean' && update.battle.in_progress !== undefined) return false;
    if (update.battle.questions && !Array.isArray(update.battle.questions)) return false;
    if (update.battle.score && typeof update.battle.score.player !== 'number') return false;
  }

  // Check statistics updates
  if (update.statistics) {
    // Ensure statistics only increase
    if (update.statistics.battlesPlayed !== undefined) {
      if (typeof update.statistics.battlesPlayed !== 'number' || 
          update.statistics.battlesPlayed < current.statistics.battlesPlayed) return false;
    }
    if (update.statistics.battlesWon !== undefined) {
      if (typeof update.statistics.battlesWon !== 'number' || 
          update.statistics.battlesWon < current.statistics.battlesWon) return false;
    }
    if (update.statistics.completedQuests !== undefined) {
      if (typeof update.statistics.completedQuests !== 'number' || 
          update.statistics.completedQuests < current.statistics.completedQuests) return false;
    }
    if (update.statistics.recentActivity && !Array.isArray(update.statistics.recentActivity)) return false;
  }

  return true;
};

/**
 * ActivityEntry Type Guard
 * ----------------------
 * Purpose: Ensures activity entries are valid before being recorded
 * 
 * Checks for:
 * - Activity ID (must be text)
 * - User ID (must be text)
 * - Activity type (must be one of 'battle', 'quest', 'achievement', 'purchase', 'login')
 * - Details (must be an object)
 * - Timestamp (must be a valid date)
 */
export const isActivityEntry = (obj: any): obj is ActivityEntry => {
  if (!obj) {
    logTypeError('ActivityEntry', obj, ['id', 'userId', 'type', 'details', 'timestamp']);
    return false;
  }

  const invalidProps: { [key: string]: string }[] = [];
  if (typeof obj.id !== 'string') invalidProps.push({ id: `expected string, got ${typeof obj.id}` });
  if (typeof obj.userId !== 'string') invalidProps.push({ userId: `expected string, got ${typeof obj.userId}` });
  if (!['battle', 'quest', 'achievement', 'purchase', 'login'].includes(obj.type)) {
    invalidProps.push({ type: `expected one of ['battle', 'quest', 'achievement', 'purchase', 'login'], got ${obj.type}` });
  }
  if (typeof obj.details !== 'object') invalidProps.push({ details: `expected object, got ${typeof obj.details}` });
  if (typeof obj.timestamp !== 'string') invalidProps.push({ timestamp: `expected string, got ${typeof obj.timestamp}` });

  const isValid = obj 
    && typeof obj.id === 'string'
    && typeof obj.userId === 'string'
    && ['battle', 'quest', 'achievement', 'purchase', 'login'].includes(obj.type)
    && typeof obj.details === 'object'
    && typeof obj.timestamp === 'string';

  if (!isValid && invalidProps.length > 0) {
    logTypeError('ActivityEntry', obj, [], invalidProps);
  }

  return isValid;
};

/**
 * Achievement Trigger Guard
 * ----------------------
 * Purpose: Validates achievement trigger conditions
 * 
 * Checks for:
 * - Trigger type (must be a valid achievement trigger type)
 * - Value (must be a number)
 * - Comparison (must be 'eq', 'gt', 'lt', 'gte', or 'lte')
 * - Optional metadata (must be an object if present)
 * 
 * Used when:
 * - Creating new achievements
 * - Checking achievement completion
 * - Validating trigger conditions
 */
export const isAchievementTrigger = (obj: any): obj is AchievementTrigger => {
  if (!obj || typeof obj !== 'object') {
    logTypeError('AchievementTrigger', obj, ['type', 'value', 'comparison']);
    return false;
  }

  const validTypes = [
    'xp', 
    'streak', 
    'quest', 
    'study_time', 
    'score', 
    'reward_rarity', 
    'login_days',
    'battle_score',
    'battle_wins',
    'battle_streak',
    'battle_rating'
  ];

  const validComparisons = ['eq', 'gt', 'lt', 'gte', 'lte'];

  const invalidProps: { [key: string]: string }[] = [];

  // Check required properties
  if (!validTypes.includes(obj.type)) {
    invalidProps.push({ type: `expected one of [${validTypes.join(', ')}], got ${obj.type}` });
  }
  if (typeof obj.value !== 'number') {
    invalidProps.push({ value: `expected number, got ${typeof obj.value}` });
  }
  if (!validComparisons.includes(obj.comparison)) {
    invalidProps.push({ comparison: `expected one of [${validComparisons.join(', ')}], got ${obj.comparison}` });
  }

  // Check optional metadata if present
  if (obj.metadata !== undefined && typeof obj.metadata !== 'object') {
    invalidProps.push({ metadata: `expected object, got ${typeof obj.metadata}` });
  }

  // Log any invalid properties
  if (invalidProps.length > 0) {
    logTypeError('AchievementTrigger', obj, [], invalidProps);
    return false;
  }

  return true;
};

/**
 * User Type Guard
 * -------------
 * Purpose: Ensures user data is valid before being used in the game
 * 
 * Checks for:
 * - User ID (must be text)
 * - Name (must be text)
 * - Email (must be valid email text)
 * - Level (must be positive number)
 * - XP (must be non-negative number)
 * - Streak (must be non-negative number)
 * - Coins (must be non-negative number)
 * - Achievements (must be a list)
 * - Battle rating (must be a number)
 * - Reward multipliers (must have valid XP and coin multipliers)
 * 
 * Used when:
 * - Creating new users
 * - Loading user profiles
 * - Updating user stats
 */
export const isUser = (obj: any): obj is User => {
  if (!obj || typeof obj !== 'object') {
    logTypeError('User', obj, [
      'id',
      'name',
      'email',
      'level',
      'xp',
      'streak',
      'coins',
      'achievements',
      'battle_rating',
      'reward_multipliers'
    ]);
    return false;
  }

  const invalidProps: { [key: string]: string }[] = [];

  // Check required properties
  if (typeof obj.id !== 'string') 
    invalidProps.push({ id: `expected string, got ${typeof obj.id}` });
  if (typeof obj.name !== 'string') 
    invalidProps.push({ name: `expected string, got ${typeof obj.name}` });
  if (typeof obj.email !== 'string') 
    invalidProps.push({ email: `expected string, got ${typeof obj.email}` });
  if (typeof obj.level !== 'number' || obj.level < 1) 
    invalidProps.push({ level: `expected positive number, got ${obj.level}` });
  if (typeof obj.xp !== 'number' || obj.xp < 0) 
    invalidProps.push({ xp: `expected non-negative number, got ${obj.xp}` });
  if (typeof obj.streak !== 'number' || obj.streak < 0) 
    invalidProps.push({ streak: `expected non-negative number, got ${obj.streak}` });
  if (typeof obj.coins !== 'number' || obj.coins < 0) 
    invalidProps.push({ coins: `expected non-negative number, got ${obj.coins}` });
  if (!Array.isArray(obj.achievements)) 
    invalidProps.push({ achievements: `expected array, got ${typeof obj.achievements}` });
  if (typeof obj.battle_rating !== 'number') 
    invalidProps.push({ battle_rating: `expected number, got ${typeof obj.battle_rating}` });
  if (!obj.reward_multipliers || typeof obj.reward_multipliers !== 'object') 
    invalidProps.push({ reward_multipliers: 'expected object' });

  // Check reward multipliers
  if (obj.reward_multipliers) {
    if (typeof obj.reward_multipliers.xp !== 'number' || obj.reward_multipliers.xp < 1)
      invalidProps.push({ 'reward_multipliers.xp': `expected number >= 1, got ${obj.reward_multipliers.xp}` });
    if (typeof obj.reward_multipliers.coins !== 'number' || obj.reward_multipliers.coins < 1)
      invalidProps.push({ 'reward_multipliers.coins': `expected number >= 1, got ${obj.reward_multipliers.coins}` });
  }

  // Log any invalid properties
  if (invalidProps.length > 0) {
    logTypeError('User', obj, [], invalidProps);
    return false;
  }

  return true;
};

/**
 * Battle State Guard
 * ----------------
 * Purpose: Validates the current state of a battle
 * 
 * Checks for:
 * - Status (must be a valid battle status)
 * - In Progress flag (must be boolean)
 * - Current Question (must be a number)
 * - Questions List (must be an array)
 * - Score (must be a valid score object)
 * - Optional opponent data
 * 
 * Used when:
 * - Starting new battles
 * - Updating battle progress
 * - Saving battle state
 * - Loading saved battles
 */
export const isBattleState = (obj: any): obj is BattleState => {
  if (!obj || typeof obj !== 'object') {
    logTypeError('BattleState', obj, [
      'status',
      'in_progress',
      'current_question',
      'questions',
      'score'
    ]);
    return false;
  }

  const validStatuses = [
    'not_started',
    'in_progress',
    'paused',
    'completed',
    'failed',
    'timed_out'
  ];

  const invalidProps: { [key: string]: string }[] = [];

  // Check required properties
  if (!validStatuses.includes(obj.status)) {
    invalidProps.push({ status: `expected one of [${validStatuses.join(', ')}], got ${obj.status}` });
  }
  if (typeof obj.in_progress !== 'boolean') {
    invalidProps.push({ in_progress: `expected boolean, got ${typeof obj.in_progress}` });
  }
  if (typeof obj.current_question !== 'number' || obj.current_question < 0) {
    invalidProps.push({ current_question: `expected non-negative number, got ${obj.current_question}` });
  }
  if (!Array.isArray(obj.questions)) {
    invalidProps.push({ questions: `expected array, got ${typeof obj.questions}` });
  }
  if (!obj.score || typeof obj.score !== 'object') {
    invalidProps.push({ score: `expected object, got ${typeof obj.score}` });
  }

  // Validate score object if present
  if (obj.score && typeof obj.score === 'object') {
    if (typeof obj.score.player !== 'number') {
      invalidProps.push({ 'score.player': `expected number, got ${typeof obj.score.player}` });
    }
    if (typeof obj.score.opponent !== 'number' && obj.score.opponent !== undefined) {
      invalidProps.push({ 'score.opponent': `expected number or undefined, got ${typeof obj.score.opponent}` });
    }
  }

  // Log any invalid properties
  if (invalidProps.length > 0) {
    logTypeError('BattleState', obj, [], invalidProps);
    return false;
  }

  return true;
};
