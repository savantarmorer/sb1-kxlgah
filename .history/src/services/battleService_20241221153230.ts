/**
 * Battle Service - Core Game System Documentation
 * 
 * This service manages all aspects of the quiz battle system, including:
 * - Question management for battles
 * - Battle results and rewards processing
 * - Player statistics tracking
 * - Opponent matching and bot creation
 * - Rating calculations
 * 
 * How it works with other parts of the system:
 * 1. Game Context (GameContext.tsx) uses this service to:
 *    - Start new battles
 *    - Process battle results
 *    - Update player progress
 * 
 * 2. Battle Components use this to:
 *    - Get questions for battles
 *    - Handle player answers
 *    - Show results and rewards
 * 
 * 3. Profile System uses this to:
 *    - Display player statistics
 *    - Show battle history
 *    - Track achievements
 */

import { supabase } from '../lib/supabase';
import type { 
  BattleQuestion, 
  BattleResults, 
  BattleState,
  BattlePhase,
  BattleAction,
  BattleOpponent,
  BattleMetadata,
  BattleRewards,
  BattleError,
  Question
} from '../types/battle';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { Logger } from '../utils/logger';
import { CircuitBreaker } from '../utils/circuitBreaker';

interface EnhancedBattleMetadata extends Required<BattleMetadata> {
  opponent_id: string;
  battle_id: string;
  time_taken: number;
  eliminated_options: string[];
}

interface EnhancedBattleState extends Omit<BattleState, 'metadata'> {
  score_player: number;
  score_opponent: number;
  rewards: Required<BattleRewards>;
  metadata: EnhancedBattleMetadata;
  opponent: BattleOpponent | null;
}

interface BattleErrorResponse extends BattleError {
  name: string;
  message: string;
  timestamp: number;
  code?: string;
  details?: any;
}

export class BattleService {
  /**
   * System Tools:
   * - Logger: Keeps track of what happens during battles
   * - Circuit Breaker: Prevents system overload
   * - Performance Monitor: Ensures smooth gameplay
   */
  private static logger = new Logger('BattleService');
  private static circuitBreaker = new CircuitBreaker('BattleService');

  /**
   * Gets Questions for a Battle
   * 
   * What it does:
   * - Fetches quiz questions from our database
   * - Can get questions of specific difficulty (easy/medium/hard)
   * - Makes sure we have enough questions for a full battle
   * - Mixes up the questions so each battle feels different
   * 
   * Used by:
   * - Battle screen when starting a new game
   * - Practice mode for training sessions
   * - Tournament system for competitive matches
   * 
   * @param difficulty - How hard the questions should be
   */
  static async fetch_battle_questions(
    difficulty?: 'easy' | 'medium' | 'hard'
  ): Promise<BattleQuestion[]> {
    const start_time = performance.now();
    try {
      BattleService.logger.debug('Starting battle questions fetch', {
        difficulty,
        requested_count: BATTLE_CONFIG.questions_per_battle
      });

      // Call the RPC function
      let query = supabase.rpc('get_random_battle_questions', { 
        difficulty_filter: difficulty || null,
        questions_limit: BATTLE_CONFIG.questions_per_battle
      });

      const { data, error } = await query;
      const query_time = performance.now() - start_time;

      BattleService.logger.debug('RPC query completed', {
        execution_time_ms: query_time,
        success: !error,
        results_count: data?.length || 0
      });

      if (error) {
        const error_metadata = {
          type: error instanceof Error ? error.name : typeof error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        };
        BattleService.logger.error('Supabase RPC error:', error_metadata);
        throw error;
      }

      if (!data || data.length === 0) {
        BattleService.logger.warn('No questions returned from database', {
          difficulty,
          requested_count: BATTLE_CONFIG.questions_per_battle
        });
        throw new Error('No questions available');
      }

      if (data.length < BATTLE_CONFIG.questions_per_battle) {
        BattleService.logger.warn('Insufficient questions returned', {
          requested: BATTLE_CONFIG.questions_per_battle,
          received: data.length,
          difficulty
        });
      }

      // Transform database records to BattleQuestion format
      const processed_questions = data.map((q: any) => ({
        id: q.id,
        text: q.text || q.question || '',
        question: q.text || q.question || '',
        options: [
          q.alternative_a || q.options?.[0] || '',
          q.alternative_b || q.options?.[1] || '',
          q.alternative_c || q.options?.[2] || '',
          q.alternative_d || q.options?.[3] || ''
        ],
        alternative_a: q.alternative_a || q.options?.[0] || '',
        alternative_b: q.alternative_b || q.options?.[1] || '',
        alternative_c: q.alternative_c || q.options?.[2] || '',
        alternative_d: q.alternative_d || q.options?.[3] || '',
        correct_answer: q.correct_answer.toUpperCase(),
        category: q.category || q.subject_area || 'general',
        subject_area: q.category || q.subject_area || 'general',
        difficulty: typeof q.difficulty === 'string' ? 
          parseInt(q.difficulty, 10) || 1 : 
          q.difficulty || 1,
        created_at: q.created_at
      }));

      const total_time = performance.now() - start_time;

      BattleService.logger.debug('Questions processed successfully', {
        processed_count: processed_questions.length,
        total_time_ms: total_time,
        sample_question: {
          id: processed_questions[0]?.id,
          difficulty: processed_questions[0]?.difficulty,
          category: processed_questions[0]?.category
        }
      });

      return processed_questions;
    } catch (error: unknown) {
      const error_time = performance.now() - start_time;

      const error_metadata = {
        type: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      };
      
      BattleService.logger.error('Battle questions fetch failed:', error_metadata);
      throw error;
    }
  }

  /**
   * Gets an opponent for a battle
   */
  static async get_opponent(opponent_id?: string): Promise<BattleOpponent> {
    if (!opponent_id) {
      return {
        id: 'bot',
        name: 'Bot Opponent',
        avatar_url: '/bot-avatar.png',
        is_bot: true,
        rating: 1000,
        level: 1,
        win_streak: 0
      };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', opponent_id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Opponent not found');
    }

    return {
      id: data.id,
      name: data.username || 'Unknown Player',
      avatar_url: data.avatar_url,
      is_bot: false,
      rating: data.rating || 1000,
      level: data.level || 1,
      win_streak: data.win_streak || 0
    };
  }

  /**
   * Updates battle statistics after a battle
   */
  static async update_battle_stats(
    user_id: string,
    results: BattleResults
  ): Promise<void> {
    try {
      const { data: stats, error: statsError } = await supabase
        .from('battle_stats')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (statsError) {
        throw statsError;
      }

      const updatedStats = {
        user_id,
        total_battles: (stats?.total_battles || 0) + 1,
        wins: (stats?.wins || 0) + (results.victory ? 1 : 0),
        losses: (stats?.losses || 0) + (!results.victory ? 1 : 0),
        win_streak: results.victory ? (stats?.win_streak || 0) + 1 : 0,
        highest_streak: Math.max(
          stats?.highest_streak || 0,
          results.victory ? (stats?.win_streak || 0) + 1 : 0
        ),
        total_xp_earned: (stats?.total_xp_earned || 0) + results.rewards.xp_earned,
        total_coins_earned: (stats?.total_coins_earned || 0) + results.rewards.coins_earned,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('battle_stats')
        .upsert(updatedStats);

      if (updateError) {
        throw updateError;
      }

      // Update battle history
      const historyEntry = {
        user_id,
        opponent_id: results.opponent_id,
        winner_id: results.victory ? user_id : results.opponent_id,
        score_player: results.score.player,
        score_opponent: results.score.opponent,
        xp_earned: results.rewards.xp_earned,
        coins_earned: results.rewards.coins_earned,
        streak_bonus: results.rewards.streak_bonus,
        created_at: new Date().toISOString(),
        is_bot_opponent: !results.opponent_id || results.opponent_id === 'bot'
      };

      const { error: historyError } = await supabase
        .from('battle_history')
        .insert(historyEntry);

      if (historyError) {
        throw historyError;
      }
    } catch (error) {
      console.error('Error updating battle stats:', error);
      throw error;
    }
  }
}

// Utility function for battle state management
export function battle_state_reducer(
  state: EnhancedBattleState, 
  action: BattleAction
): EnhancedBattleState {
  switch (action.type) {
    case 'START_BATTLE':
      return {
        ...state,
        phase: BattlePhase.PREPARING,
        status: 'preparing',
        metadata: {
          battle_id: action.payload.battle_id,
          opponent_id: action.payload.opponent_id,
          is_bot: action.payload.is_bot
        }
      };
    
    case 'BEGIN_BATTLE':
      return {
        ...state,
        phase: BattlePhase.IN_PROGRESS,
        status: 'active',
        current_question: 0,
        total_questions: action.payload.total_questions
      };
    
    case 'ANSWER_QUESTION':
      return {
        ...state,
        current_question: state.current_question + 1,
        score_player: action.payload.is_correct 
          ? state.score_player + 1 
          : state.score_player
      };
    
    case 'COMPLETE_BATTLE':
      return {
        ...state,
        phase: BattlePhase.COMPLETED,
        status: action.payload.is_victory ? 'victory' : 'defeat',
        score_player: action.payload.score_player,
        score_opponent: action.payload.score_opponent,
        rewards: {
          xp: action.payload.rewards.xp,
          coins: action.payload.rewards.coins,
          items: action.payload.rewards.items,
          achievements: action.payload.rewards.achievements
        }
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        phase: BattlePhase.ERROR,
        status: 'error',
        error: {
          message: action.payload.message,
          timestamp: Date.now()
        }
      };
    
    default:
      return state;
  }
}

/**
 * Handles battle results from the UI component
 */
export async function handle_battle_results(
  user_id: string,
  battle_state: EnhancedBattleState,
  rewards: {
    xp_earned: number;
    coins_earned: number;
    streak_bonus: number;
  }
): Promise<void> {
  console.log('Standalone handle_battle_results called, redirecting to BattleService method');
  const results: BattleResults = {
    victory: battle_state.score_player > battle_state.score_opponent,
    draw: battle_state.score_player === battle_state.score_opponent,
    user_id: user_id,
    score: {
      player: battle_state.score_player,
      opponent: battle_state.score_opponent
    },
    rewards: rewards,
    stats: {
      time_taken: battle_state.metadata?.time_taken || 0,
      total_questions: battle_state.total_questions || 0,
      average_time: 0,
      correct_answers: battle_state.score_player || 0
    }
  };

  // Get the game state from somewhere - this needs to be passed in from the UI
  const gameState = await BattleService.getCurrentGameState(user_id);
  
  await BattleService.handle_battle_results(results, gameState);
}