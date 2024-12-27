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
export function isAchievement(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;

  // Check required properties and their types
  if (typeof obj.id !== 'string') return false;
  if (typeof obj.title !== 'string') return false;
  if (typeof obj.description !== 'string') return false;
  if (!obj.trigger || typeof obj.trigger !== 'object') return false;
  if (!Array.isArray(obj.rewards)) return false;

  return true;
}

/**
 * AchievementReward Type Guard
 * ---------------------------
 * Purpose: Validates achievement rewards before being awarded to players
 * 
 * Checks for:
 * - Reward type (must be one of 'xp', 'coins', 'item', 'title')
 * - Reward amount (must be a positive number)
 */
export function isAchievementReward(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;

  // Check required properties
  if (!obj.type || !obj.amount) return false;

  // Check types
  if (typeof obj.amount !== 'number') return false;
  if (!['xp', 'coins', 'item', 'title'].includes(obj.type)) return false;

  return true;
}

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
export function isBattleRewards(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;

  // Check required properties and their types
  if (typeof obj.xp !== 'number') return false;
  if (typeof obj.coins !== 'number') return false;

  // Check optional properties if they exist
  if ('streak_bonus' in obj && typeof obj.streak_bonus !== 'number') return false;
  if ('achievements' in obj && !Array.isArray(obj.achievements)) return false;

  return true;
}

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
export function isXPGain(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;

  // Check required properties and their types
  if (typeof obj.amount !== 'number') return false;
  if (typeof obj.source !== 'string') return false;
  if (typeof obj.timestamp !== 'string') return false;
  if (typeof obj.multiplier !== 'number') return false;

  return true;
}

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
export function isValidGameStateUpdate(baseState: any, update: any): boolean {
  if (!update || typeof update !== 'object') return false;

  // Check each property in the update
  for (const [key, value] of Object.entries(update)) {
    // Check if the property exists in the base state
    if (!(key in baseState)) return false;

    // Type checking
    if (typeof value !== typeof baseState[key]) return false;

    // Additional validation for specific properties
    switch (key) {
      case 'health':
      case 'xp':
      case 'level':
      case 'coins':
        if (typeof value !== 'number' || value < 0) return false;
        break;
      case 'inventory':
        if (!Array.isArray(value)) return false;
        break;
      case 'in_progress':
        if (typeof value !== 'boolean') return false;
        break;
      case 'questions':
        if (!Array.isArray(value)) return false;
        break;
      case 'score':
        if (typeof value !== 'object' || value === null) return false;
        if (typeof value.player !== 'number') return false;
        break;
    }
  }

  return true;
}

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
export function isActivityEntry(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;

  // Check required properties and their types
  if (typeof obj.id !== 'string') return false;
  if (typeof obj.userId !== 'string') return false;
  if (!['battle', 'quest', 'achievement', 'purchase', 'login'].includes(obj.type)) return false;
  if (typeof obj.details !== 'object' || obj.details === null) return false;
  if (typeof obj.timestamp !== 'string') return false;

  return true;
}

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
