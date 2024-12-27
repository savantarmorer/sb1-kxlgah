import { Achievement } from '../types/achievements';

/**
 * Battle-related achievement configurations
 * Used for consistent achievement creation across the system
 */
export const BATTLE_ACHIEVEMENTS = {
  PERFECT_BATTLE: {
    id: 'perfect_battle',
    title: 'Perfect Scholar',
    description: 'Answer all questions correctly in a battle',
    category: 'battles',
    points: 100,
    rarity: 'legendary',
    prerequisites: [],
    dependents: [],
    trigger_conditions: [{
      type: 'battle_score',
      value: 100,
      comparison: 'eq'
    }],
    order: 100,
    metadata: {
      icon: '🎯',
      color: 'text-yellow-500'
    }
  },
  BATTLE_STREAK: {
    id: 'battle_streak_3',
    title: 'Battle Master',
    description: 'Win 3 battles in a row',
    category: 'battles',
    points: 50,
    rarity: 'epic',
    prerequisites: [],
    dependents: [],
    trigger_conditions: [{
      type: 'battle_streak',
      value: 3,
      comparison: 'gte'
    }],
    order: 90,
    metadata: {
      icon: '⚔️',
      color: 'text-purple-500'
    }
  }
} as const;

/**
 * Configuration Role:
 * - Centralized achievement definitions
 * - Type-safe achievement creation
 * - Consistent achievement properties
 * 
 * Dependencies:
 * - Achievement types
 * 
 * Used by:
 * - BattleService
 * - AchievementSystem
 * - Admin achievement management
 */ 