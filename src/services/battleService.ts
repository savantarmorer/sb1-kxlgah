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

import { supabase } from '../lib/supabaseClient';
import { 
  BattleQuestion, 
  BattleResults, 
  BattleTransaction,
  EnhancedBattleState,
  BattlePhase,
  BattleAction
} from '../types/battle';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { Logger, LogLevel } from '../utils/logger';
import { CircuitBreaker } from '../utils/circuitBreaker';
import { PerformanceMonitor } from '../utils/performanceMonitor';
import { ProgressService } from '../services/progressService'; // Import ProgressService
import { 
  calculate_xp_reward,
  calculate_coin_reward,
  update_streak_multiplier
} from '../utils/gameUtils';

// Database Table Interfaces
interface BattleHistoryDB {
  id?: string;
  user_id: string;
  opponent_id: string | null;
  winner_id: string | null;
  score_player: number;
  score_opponent: number;
  xp_earned: number;
  coins_earned: number;
  streak_bonus: number;
  created_at?: string;
  is_bot_opponent: boolean;
}

interface battle_statsDB {
  user_id: string;
  total_battles: number;
  wins: number;
  losses: number;
  win_streak: number;
  highest_streak: number;
  total_xp_earned: number;
  total_coins_earned: number;
  updated_at?: string;
}

export class BattleService {
  /**
   * System Tools:
   * - Logger: Keeps track of what happens during battles
   * - Circuit Breaker: Prevents system overload
   * - Performance Monitor: Ensures smooth gameplay
   */
  private static logger = new Logger('BattleService');
  private static circuit_breaker = new CircuitBreaker();
  private static performance = new PerformanceMonitor();

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

      console.log('Fetching total questions count...');
      const { count: total_questions, error: count_error } = await supabase
        .from('battle_questions')
        .select('*', { count: 'exact', head: true });

      console.log('Total questions query result:', { total_questions, count_error });

      if (count_error) {
        console.error('Error counting total questions:', count_error);
        BattleService.logger.error('Error counting total questions:', count_error);
        throw count_error;
      }

      console.log('Successfully counted total questions:', total_questions);
      BattleService.logger.debug('Total questions in database:', { total_questions });

      // If filtering by difficulty, check available questions for that difficulty
      if (difficulty) {
        console.log('Fetching filtered questions count for difficulty:', difficulty);
        const { count: filtered_count, error: filter_error } = await supabase
          .from('battle_questions')
          .select('*', { count: 'exact', head: true })
          .eq('difficulty', difficulty);

        console.log('Filtered questions query result:', { filtered_count, filter_error });
      }

      // Call the RPC function
      let query = supabase.rpc('get_random_battle_questions', { 
        difficulty_filter: difficulty || null,
        questions_limit: BATTLE_CONFIG.questions_per_battle
      });

      const { data, error } = await query;
      const query_time = performance.now() - start_time;

      // Record performance metrics
      BattleService.performance.recordMetric('battle_questions_fetch', {
        duration: query_time,
        success: !error,
        difficulty: difficulty || 'any',
        total_questions,
        returned_count: data?.length || 0
      });

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
      const processed_questions = data.map((q: BattleQuestion) => ({
        id: q.id,
        question: q.question,
        alternatives: {
          a: q.alternative_a || '',
          b: q.alternative_b || '',
          c: q.alternative_c || '',
          d: q.alternative_d || ''
        },
        correct_answer: q.correct_answer.toUpperCase(),
        category: q.category || 'general',
        difficulty: q.difficulty || 'medium'
      }));

      const total_time = performance.now() - start_time;
      BattleService.performance.recordMetric('battle_questions_total', {
        duration: total_time,
        processing_time: total_time - query_time,
        questions_processed: processed_questions.length
      });

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
      BattleService.performance.recordMetric('battle_questions_error', {
        duration: error_time,
        error_type: error instanceof Error ? error.name : 'UnknownError',
        error_message: error instanceof Error ? error.message : String(error)
      });
      
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
   * Records Battle Results
   * 
   * What it does:
   * - Saves who won and lost
   * - Calculates rewards (XP and coins)
   * - Updates winning streaks
   * - Tracks performance statistics
   * 
   * Important features:
   * - Gives bonus rewards for winning streaks
   * - Adjusts rewards based on difficulty
   * - Keeps track of battle history
   * 
   * Used by:
   * - Results screen after battle
   * - Achievement system
   * - Player statistics
   */
  static async record_battle_results(
    battle_state: EnhancedBattleState,
    user_id: string
  ): Promise<BattleTransaction> {
    // Validate input
    if (!battle_state || !user_id) {
      throw new Error('Invalid battle state or user ID');
    }

    const is_victory = battle_state.status === 'victory';

    try {
      return await PerformanceMonitor.measure('record_battle_results', async () => {
        BattleService.logger.debug('Starting battle results recording', {
          user_id,
          battle_status: battle_state.status,
          score: {
            player: battle_state.player_score,
            opponent: battle_state.opponent_score
          }
        });

        // Get user progress to determine level
        const user_progress = await ProgressService.get_progress(user_id);
        const player_level = user_progress?.level || 1; // Default to level 1 if not found
        
        // Calculate base XP based on score
        const total_possible_score = BATTLE_CONFIG.questions_per_battle * BATTLE_CONFIG.points_per_question;
        const score_ratio = battle_state.player_score / total_possible_score;
        const base_xp = Math.round(BATTLE_CONFIG.progress.base_xp * score_ratio);
        const base_coins = Math.round(BATTLE_CONFIG.progress.base_coins * score_ratio);
        
        // Default to medium difficulty (2) if not specified
        const difficulty_level = 2;
        
        // Get streak from rewards bonuses if available
        const streak = battle_state.rewards?.bonuses?.find(b => b.type === 'streak')?.amount || 0;
        
        // Calculate rewards with proper parameters
        const xp_earned = Math.max(calculate_xp_reward(
          base_xp,
          difficulty_level,
          streak
        ), 1);

        // Calculate coin rewards with base amount and level
        const coins_earned = Math.max(calculate_coin_reward(base_coins, player_level, streak), 1);
        
        BattleService.logger.debug('Rewards calculated', {
          score_ratio,
          total_possible_score,
          base_xp,
          base_coins,
          xp_earned,
          coins_earned,
          streak: streak
        });

        // Get current streak for multiplier
        const { data: current_stats } = await supabase
          .from('battle_stats')
          .select('win_streak, highest_streak')
          .eq('user_id', user_id)
          .single();

        // Only update streak if victory, otherwise use current streak
        const streak_for_multiplier = is_victory ? (current_stats?.win_streak || 0) + 1 : 0;
        const streak_multiplier = update_streak_multiplier(streak_for_multiplier);

        BattleService.logger.debug('Streak information retrieved', {
          current_streak: current_stats?.win_streak || 0,
          highest_streak: current_stats?.highest_streak || 0,
          new_multiplier: streak_multiplier
        });

        // Apply streak bonus
        const streak_bonus = Math.min(
          Math.floor(xp_earned * BATTLE_CONFIG.rewards.streak_bonus.multiplier * streak_for_multiplier),
          BATTLE_CONFIG.rewards.streak_bonus.max_bonus
        );
        const final_xp = xp_earned + streak_bonus;
        const final_coins = coins_earned;

        BattleService.logger.debug('Final rewards calculated', {
          base_xp,
          streak_bonus,
          final_xp,
          final_coins,
          multiplier: streak_multiplier
        });

        // 1. Record Battle History
        const battle_history_entry: BattleHistoryDB = {
          id: crypto.randomUUID(),
          user_id: user_id,
          opponent_id: battle_state.metadata.is_bot ? null : (battle_state.metadata.opponent_id ?? null),
          winner_id: is_victory ? user_id : (battle_state.metadata.is_bot ? null : (battle_state.metadata.opponent_id ?? null)),
          score_player: battle_state.player_score,
          score_opponent: battle_state.opponent_score,
          xp_earned: final_xp,
          coins_earned: final_coins,
          streak_bonus: streak_bonus,
          is_bot_opponent: battle_state.metadata.is_bot,
          created_at: new Date().toISOString()
        };

        BattleService.logger.debug('Recording battle history', battle_history_entry);

        const { error: history_error } = await supabase
          .from('battle_history')
          .insert(battle_history_entry);

        if (history_error) {
          BattleService.logger.error('Failed to record battle history', {
            error: history_error,
            entry: battle_history_entry
          });
          throw history_error;
        }

        // 2. Update Battle Stats
        const stats_update = {
          total_battles: 1,
          wins: is_victory ? 1 : 0,
          losses: !is_victory ? 1 : 0,
          win_streak: is_victory ? (current_stats?.win_streak || 0) + 1 : 0,
          highest_streak: Math.max(
            current_stats?.highest_streak || 0,
            is_victory ? (current_stats?.win_streak || 0) + 1 : 0
          ),
          total_xp_earned: final_xp,
          total_coins_earned: final_coins
        };

        BattleService.logger.debug('Updating battle stats', stats_update);

        const { error: stats_error } = await supabase
          .from('battle_stats')
          .upsert({
            user_id,
            ...stats_update,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          });

        if (stats_error) {
          BattleService.logger.error('Failed to update battle stats', {
            error: stats_error,
            stats: stats_update
          });
          throw stats_error;
        }

        // 3. Update User XP and Coins
        const { error: user_error } = await supabase.rpc('update_user_rewards', {
          p_user_id: user_id,
          p_xp: final_xp,
          p_coins: final_coins
        });

        if (user_error) {
          BattleService.logger.error('Failed to update user rewards', {
            error: user_error,
            rewards: { xp: final_xp, coins: final_coins }
          });
          throw user_error;
        }

        BattleService.logger.info('Battle results recorded successfully', {
          user_id,
          xp_earned: final_xp,
          coins_earned: final_coins,
          streak: stats_update.win_streak
        });

        return {
          id: battle_state.metadata?.battle_id,
          user_id,
          opponent_id: battle_state.metadata?.opponent_id,
          type: 'battle_end',
          status: 'completed',
          metadata: {
            ...battle_state,
            rewards: {
              xp: final_xp,
              coins: final_coins,
              items: battle_state.rewards.items,
              achievements: battle_state.rewards.achievements
            }
          },
          created_at: new Date()
        };

      });
    } catch (error: unknown) {
      BattleService.logger.error('Failed to record battle results', {
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.name : 'UnknownError',
        battle_state: {
          status: battle_state.status,
          scores: {
            player: battle_state.player_score,
            opponent: battle_state.opponent_score
          }
        }
      });
      throw error;
    }
  }

  /**
   * Updates Player Statistics
   * 
   * What it does:
   * - Updates total battles played
   * - Tracks win/loss record
   * - Records highest winning streaks
   * - Updates total rewards earned
   * 
   * This information is used for:
   * - Player profiles
   * - Leaderboards
   * - Achievement tracking
   * - Matchmaking
   */
  static async update_stats(
    user_id: string,
    results: BattleResults,
    current_stats: Partial<battle_statsDB> = {}
  ): Promise<void> {
    try {
      // Extract and validate battle results
      const { 
        isVictory,  
        score_player,
        score_opponent,
        streak_bonus,
        is_bot_opponent,
        opponent_id,
        user_id
      } = results;

      // Calculate performance metrics
      const score_percentage = Math.round((score_player / (score_player + score_opponent)) * 100);
      const new_streak = isVictory ? (current_stats.win_streak || 0) + 1 : 0;
      const highest_streak = Math.max(new_streak, current_stats.highest_streak || 0);

      // Calculate base rewards
      const total_possible_score = BATTLE_CONFIG.questions_per_battle * BATTLE_CONFIG.points_per_question;
      const score_ratio = score_player / total_possible_score;
      const base_xp = Math.round(BATTLE_CONFIG.progress.base_xp * score_ratio);
      const base_coins = Math.round(BATTLE_CONFIG.progress.base_coins * score_ratio);
      
      // Calculate final rewards
      const xp_earned = Math.max(calculate_xp_reward(base_xp, new_streak), 1);
      const coins_earned = Math.max(calculate_coin_reward(base_coins, new_streak), 1);

      BattleService.logger.debug('Rewards calculated', {
        score_ratio,
        total_possible_score,
        base_xp,
        base_coins,
        xp_earned,
        coins_earned,
        streak: new_streak
      });

      // Update battle history
      const { error: history_error } = await supabase
        .from('battle_history')
        .insert({
          user_id,
          opponent_id,
          winner_id: isVictory ? user_id : opponent_id,
          score_player,
          score_opponent,
          xp_earned,
          coins_earned,
          streak_bonus,
          is_bot_opponent,
          created_at: new Date().toISOString()
        });

      if (history_error) {
        BattleService.logger.error('Failed to update battle history', {
          error: history_error,
          stats: {
            user_id,
            opponent_id,
            winner_id: isVictory ? user_id : opponent_id,
            score_player,
            score_opponent,
            xp_earned,
            coins_earned,
            streak_bonus,
            is_bot_opponent
          }
        });
        throw history_error;
      }

      // Prepare new stats with proper defaults
      const new_stats: battle_statsDB = {
        user_id,
        total_battles: (current_stats.total_battles || 0) + 1,
        wins: (current_stats.wins || 0) + (isVictory ? 1 : 0),
        losses: (current_stats.losses || 0) + (!isVictory ? 1 : 0),
        win_streak: new_streak,
        highest_streak,
        total_xp_earned: (current_stats.total_xp_earned || 0) + xp_earned,
        total_coins_earned: (current_stats.total_coins_earned || 0) + coins_earned,
        updated_at: new Date().toISOString()
      };

      // Log stats update for monitoring
      BattleService.logger.debug('Updating battle stats:', {
        user_id,
        current_stats: current_stats as Partial<battle_statsDB>,
        new_stats,
        performance: {
          score_percentage,
          streak: new_streak,
          highest_streak
        }
      });

      // Update database
      const { error } = await supabase
        .from('battle_stats')
        .upsert(new_stats, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) {
        BattleService.logger.error('Failed to update battle stats', {
          error: error instanceof Error ? error.message : String(error),
          errorType: error instanceof Error ? error.name : 'UnknownError',
          stats: new_stats
        });
        throw error;
      }

    } catch (error: unknown) {
      BattleService.logger.error('Error updating battle stats', {
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.name : 'UnknownError'
      });
      throw error;
    }
  }

  /**
   * Completes a Battle
   * 
   * What it does:
   * - Finalizes battle results
   * - Awards rewards
   * - Updates statistics
   * - Records battle history
   * 
   * Safety features:
   * - Prevents system overload
   * - Ensures all updates complete correctly
   * - Keeps backup of important data
   */
  static async complete_battle(
    results: BattleResults, 
    user_id: string
  ): Promise<BattleTransaction> {
    // Verifica se pode executar a batalha
    if (!BattleService.circuit_breaker.is_allowed()) {
      const error = new Error('Sistema temporariamente indisponível');
      
      Logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.ERROR, 
        context: 'BattleService', 
        message: 'Circuit breaker is open', 
        metadata: { 
          user_id, 
          circuit_state: BattleService.circuit_breaker.get_state() 
        }
      });
      throw error;
    }

    try {
      // Mede performance da transação de batalha
      return await PerformanceMonitor.measure('complete_battle', async () => {
        // Get current battle stats
        const { data: current_stats, error: stats_error } = await supabase
          .from('battle_stats')
          .select('*')
          .eq('user_id', user_id)
          .single();

        if (stats_error) {
          // Registra falha no circuit breaker
          BattleService.circuit_breaker.record_failure(
            'BattleTransaction', 
            new Error(stats_error.message)
          );
          
          Logger.log({
            timestamp: new Date().toISOString(),
            level: LogLevel.ERROR, 
            context: 'BattleService', 
            message: 'Battle transaction failed', 
            metadata: { 
              user_id, 
              results,
              error_details: stats_error 
            }
          });
          
          throw stats_error;
        }

        // Sucesso: reseta circuit breaker
        if (BattleService.circuit_breaker) {
          BattleService.circuit_breaker.reset_state();
        }

        // Log de sucesso
        Logger.log({
          timestamp: new Date().toISOString(),
          level: LogLevel.INFO, 
          context: 'BattleService', 
          message: 'Battle completed successfully', 
          metadata: { 
            user_id, 
            battle_id: current_stats?.battle_id 
          }
        });

        return current_stats;
      }, 2000  // Threshold de 2 segundos para batalha
      );
    } catch (error: unknown) {
      // Tratamento de erro genérico
      BattleService.circuit_breaker.record_failure(
        'BattleCompletion', 
        error instanceof Error ? error : new Error(String(error))
      );
      
      Logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.ERROR, 
        context: 'BattleService', 
        message: 'Battle completion failed', 
        metadata: { 
          user_id, 
          results,
          circuit_state: BattleService.circuit_breaker.get_state()
        }
      });

      throw error;
    }
  }

  /**
   * Creates Computer Opponents (Bots)
   * 
   * What it does:
   * - Creates AI opponents for practice
   * - Adjusts bot difficulty based on player level
   * - Gives bots fun, random names
   * 
   * Used for:
   * - Practice mode
   * - When no human opponents are available
   * - Training sessions
   */
  static async create_bot_opponent(player_level: number) {
    return {
      id: `bot_${Date.now()}`,
      name: BattleService.generate_bot_name(),
      rating: BATTLE_CONFIG.matchmaking.default_rating,
      is_bot: true,
      level: Math.max(1, player_level - 1)
    };
  }

  /**
   * Generates Bot Names
   * 
   * What it does:
   * - Creates realistic-sounding names for bot opponents
   * - Uses legal profession titles (Prof., Dr., Juiz, etc.)
   * - Makes each bot feel unique
   */
  private static generate_bot_name(): string {
    const prefixes = ['Prof.', 'Dr.', 'Mestre', 'Juiz', 'Advogado'];
    const first_names = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Luiza', 'Paulo', 'Clara'];
    const last_names = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues'];

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const first_name = first_names[Math.floor(Math.random() * first_names.length)];
    const last_name = last_names[Math.floor(Math.random() * last_names.length)];

    return `${prefix} ${first_name} ${last_name}`;
  }

  /**
   * Gets a Bot Opponent for a Battle
   * 
   * What it does:
   * - Creates a bot opponent for a battle
   * - Adjusts bot difficulty based on player level
   * 
   * Used by:
   * - Practice mode
   * - When no human opponents are available
   * - Training sessions
   */
  static async get_bot_opponent(player_level: number) {
    return BattleService.create_bot_opponent(player_level);
  }

  /**
   * Gets a Human Opponent for a Battle
   * 
   * What it does:
   * - Finds a human opponent for a battle
   * - Matches players of similar skill
   * 
   * Used by:
   * - Matchmaking system
   * - Quick play mode
   * - Tournament system
   */
  static async get_opponent(opponent_id?: string) {
    if (!opponent_id) {
      throw new Error('Opponent ID is required for non-bot battles');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', opponent_id)
      .single();

    if (error) {
      console.error('Error fetching opponent:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Opponent not found');
    }

    return {
      id: data.id,
      name: data.name,
      rating: data.battle_rating || BATTLE_CONFIG.matchmaking.default_rating,
      is_bot: false,
      level: data.level || 1
    };
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
        player_score: action.payload.is_correct 
          ? state.player_score + 1 
          : state.player_score
      };
    
    case 'COMPLETE_BATTLE':
      return {
        ...state,
        phase: BattlePhase.COMPLETED,
        status: action.payload.is_victory ? 'victory' : 'defeat',
        player_score: action.payload.player_score,
        opponent_score: action.payload.opponent_score,
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