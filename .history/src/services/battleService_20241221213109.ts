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
import { 
  BattleQuestion, 
  BattleResults, 
  BattleTransaction,
  EnhancedBattleState,
  BattlePhase,
  BattleAction,
  DBBattleResults
} from '../types/battle';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { Logger, LogLevel } from '../utils/logger';
import { CircuitBreaker } from '../utils/circuitBreaker';
import { ProgressService } from '../services/progressService';
import { LevelSystem } from '../lib/levelSystem';
import { GameState } from '@/contexts/game/types';
import { BattleRatingService } from '../services/battleRatingService';
import { InventoryItem, ItemType, ItemRarity, ItemEffect } from '../types/items';

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

interface BattleStatsDB {
  user_id: string;
  total_battles: number;
  wins: number;
  losses: number;
  win_streak: number;
  highest_streak: number;
  total_xp_earned: number;
  total_coins_earned: number;
  tournaments_played: number;
  tournaments_won: number;
  tournament_matches_played: number;
  tournament_matches_won: number;
  tournament_rating: number;
  difficulty: number;
  updated_at: string;
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
        alternative_a: q.alternative_a || '',
        alternative_b: q.alternative_b || '',
        alternative_c: q.alternative_c || '',
        alternative_d: q.alternative_d || '',
        correct_answer: q.correct_answer.toUpperCase(),
        category: q.category || 'general',
        difficulty: q.difficulty || 'medium'
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
   * BATALHA COMPLETA > CHAMA O METODO DE RECORDAR RESULTADOS > CHAMA O METODO DE ATUALIZAR PROGRESSO
   */
  public static async handle_battle_results(
    results: BattleResults,
    state: GameState
  ): Promise<void> {
    console.log('handle_battle_results called with:', {
      results,
      user: state.user?.id,
      battle_stats: state.battle_stats
    });

    if (!state.user) {
      throw new Error('User not found in game state');
    }

    if (!BattleService.circuit_breaker.is_allowed()) {
      const error = new Error('System temporarily unavailable');
      BattleService.logger.error('Circuit breaker is open', {
        user_id: state.user.id,
        circuit_state: BattleService.circuit_breaker.get_state()
      });
      throw error;
    }

    try {
      // Calculate new XP and level using LevelSystem
      const current_xp = state.user.xp || 0;
      const new_xp = current_xp + results.rewards.xp_earned;
      const level_data = LevelSystem.calculate_level_data(new_xp);
      const new_streak = results.victory ? (state.user.streak || 0) + 1 : 0;

      console.log('Attempting to update profile:', {
        user_id: state.user.id,
        new_xp,
        new_level: level_data.current_level
      });

      // Update profile with exact database schema columns
      const { data: updated_profile } = await supabase
        .from('profiles')
        .upsert({
          id: state.user.id,
          name: state.user.name,
          level: level_data.current_level,
          xp: new_xp,
          coins: (state.user.coins || 0) + results.rewards.coins_earned,
          streak: new_streak,
          study_time: (state.user.study_time || 0) + results.stats.time_taken,
          constitutional_score: state.user.constitutional_score || 0,
          civil_score: state.user.civil_score || 0,
          criminal_score: state.user.criminal_score || 0,
          administrative_score: state.user.administrative_score || 0,
          gems: state.user.gems || 0,
          avatar_url: state.user.avatar_url,
          is_bot: false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      // Insert battle history with exact schema columns
      const battle_history = {
        user_id: state.user.id,
        opponent_id: results.opponent_id || null,
        winner_id: results.victory ? state.user.id : null,
        score_player: results.score.player,
        score_opponent: results.score.opponent,
        xp_earned: results.rewards.xp_earned,
        coins_earned: results.rewards.coins_earned,
        streak_bonus: results.rewards.streak_bonus,
        is_bot_opponent: true,
        difficulty: state.battle_stats?.difficulty || 1,
        draw: results.draw,
        time_left: results.stats.time_taken,
        total_questions: results.stats.total_questions,
        victory: results.victory,
        created_at: new Date().toISOString()
      };

      const { data: history_data, error: history_error } = await supabase
        .from('battle_history')
        .insert(battle_history)
        .select();

      if (history_error) {
        console.error('Battle history insert failed:', history_error);
        BattleService.logger.error('Failed to insert battle history', { history_error });
        throw history_error;
      }

      // Update battle stats and progress
      try {
        await ProgressService.update_battle_progress(state.user.id, {
          is_victory: results.victory,
          xp_earned: results.rewards.xp_earned,
          coins_earned: results.rewards.coins_earned,
          streak_bonus: results.rewards.streak_bonus
        });

        // Update battle ratings separately
        if (results.opponent_id) {
          await BattleRatingService.updateRatings(
            results.victory ? state.user.id : results.opponent_id,
            results.victory ? results.opponent_id : state.user.id
          );
        }

      } catch (progress_error) {
        console.error('Battle stats update failed:', progress_error);
        BattleService.logger.error('Failed to update progress or battle stats', { progress_error });
        throw progress_error;
      }

      BattleService.circuit_breaker.reset_state();
      
      BattleService.logger.info('Battle completed successfully', {
        user_id: state.user.id,
        victory: results.victory,
        level_up: level_data.current_level > (state.user.level || 1)
      });

    } catch (error) {
      BattleService.circuit_breaker.record_failure(
        'BattleCompletion',
        error instanceof Error ? error : new Error(String(error))
      );
      
      BattleService.logger.error('Battle completion failed', {
        user_id: state.user.id,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }

  /**
   * Creates Computer Opponents (Bots)
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

  static async record_battle_results(
    user_id: string,
    battle_state: EnhancedBattleState,
    victory: boolean,
    rewards: {
      xp_earned: number;
      coins_earned: number;
      streak_bonus: number;
    }
  ): Promise<void> {
    const { data, error } = await supabase
      .from('battle_history')
      .insert({
        user_id,
        opponent_id: battle_state.metadata?.opponent_id || null,
        winner_id: victory ? user_id : null,
        score_player: battle_state.score_player,
        score_opponent: battle_state.score_opponent,
        xp_earned: rewards.xp_earned,
        coins_earned: rewards.coins_earned,
        streak_bonus: rewards.streak_bonus,
        is_bot_opponent: battle_state.metadata?.is_bot || false,
        created_at: new Date().toISOString()
      });

    if (error) {
      BattleService.logger.error('Failed to record battle results', { error });
      throw error;
    }
  }

  /**
   * Gets a Bot Opponent for a Battle
   */
  static async get_bot_opponent(player_level: number) {
    return BattleService.create_bot_opponent(player_level);
  }

  /**
   * Gets a Human Opponent for a Battle
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

  /**
   * Updates battle statistics after a battle
   */
  public static async update_battle_stats(
    user_id: string,
    results: BattleResults,
    current_stats?: BattleStatsDB
  ): Promise<void> {
    if (!user_id) return;

    let stats = current_stats;
    
    if (!stats) {
      const { data, error: stats_error } = await supabase
        .from('battle_stats')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (stats_error) {
        BattleService.logger.error('Failed to fetch battle stats', { stats_error });
        throw stats_error;
      }
      stats = data;
    }

    const updated_stats: BattleStatsDB = {
      user_id,
      total_battles: (stats?.total_battles || 0) + 1,
      wins: results.victory ? (stats?.wins || 0) + 1 : (stats?.wins || 0),
      losses: !results.victory ? (stats?.losses || 0) + 1 : (stats?.losses || 0),
      win_streak: results.victory ? (stats?.win_streak || 0) + 1 : 0,
      highest_streak: results.victory 
        ? Math.max(stats?.highest_streak || 0, (stats?.win_streak || 0) + 1)
        : stats?.highest_streak || 0,
      total_xp_earned: (stats?.total_xp_earned || 0) + results.rewards.xp_earned,
      total_coins_earned: (stats?.total_coins_earned || 0) + results.rewards.coins_earned,
      tournaments_played: stats?.tournaments_played || 0,
      tournaments_won: stats?.tournaments_won || 0,
      tournament_matches_played: stats?.tournament_matches_played || 0,
      tournament_matches_won: stats?.tournament_matches_won || 0,
      tournament_rating: stats?.tournament_rating || 0,
      difficulty: stats?.difficulty || 1,
      updated_at: new Date().toISOString()
    };

    const { error: update_error } = await supabase
      .from('battle_stats')
      .upsert(updated_stats);

    if (update_error) {
      BattleService.logger.error('Failed to update battle stats', { update_error });
      throw update_error;
    }
  }

  /**
   * Updates user profile with new values after battle
   */
  private static async update_user_profile(
    user_id: string,
    updates: {
      xp: number;
      coins: number;
      level: number;
      streak: number;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        xp: updates.xp,
        coins: updates.coins,
        level: updates.level,
        streak: updates.streak,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id);

    if (error) {
      BattleService.logger.error('Failed to update user profile', { error });
      throw error;
    }
  }

  /**
   * Gets the current game state for a user
   */
  public static async getCurrentGameState(user_id: string): Promise<GameState> {
    console.log('Getting current game state for user:', user_id);
    
    // Get user profile
    const { data: user, error: user_error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (user_error) {
      console.error('Failed to get user profile:', user_error);
      throw user_error;
    }

    // Get battle stats
    const { data: battle_stats, error: stats_error } = await supabase
      .from('battle_stats')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (stats_error && stats_error.code !== 'PGRST116') { // Ignore not found error
      console.error('Failed to get battle stats:', stats_error);
      throw stats_error;
    }

    // Get user inventory
    interface InventoryItemResponse {
      id: string;
      user_id: string;
      item_id: string;
      quantity: number;
      equipped: boolean;
      acquired_at: string;
      items: {
        id: string;
        name: string;
        description: string;
        type: ItemType;
        rarity: ItemRarity;
        cost: number;
        effects: ItemEffect[];
        requirements: Record<string, any>;
        metadata: Record<string, any>;
        is_active: boolean;
        icon: string;
        icon_color: string;
        effect_multiplier: number;
        allowed_combinations: string[];
      };
    }

    const { data: inventory_items, error: inventory_error } = await supabase
      .from('user_inventory')
      .select(`
        *,
        items!inner (*)
      `)
      .eq('user_id', user_id) as { data: InventoryItemResponse[] | null, error: any };

    if (inventory_error) {
      console.error('Failed to get user inventory:', inventory_error);
      throw inventory_error;
    }

    console.log('Raw inventory items:', inventory_items);

    // Transform inventory items to the expected format
    const inventory: { items: InventoryItem[], equipped: string[] } = {
      items: inventory_items?.map(inv => ({
        id: inv.item_id,
        name: inv.items?.name || '',
        description: inv.items?.description || '',
        type: inv.items?.type || ItemType.CONSUMABLE,
        rarity: inv.items?.rarity || ItemRarity.COMMON,
        equipped: inv.equipped || false,
        quantity: inv.quantity || 0,
        imageUrl: inv.items?.icon || '/images/items/default.png',
        metadata: inv.items?.metadata || {},
        itemId: inv.item_id,
        effects: inv.items?.effects || [],
        acquired_at: inv.acquired_at || new Date().toISOString(),
        is_active: inv.items?.is_active || false
      })) || [],
      equipped: inventory_items?.filter(inv => inv.equipped).map(inv => inv.item_id) || []
    };

    console.log('Retrieved game state:', { user, battle_stats, inventory });

    return {
      user,
      battle: {
        status: 'idle',
        current_question: 0,
        total_questions: 0,
        questions: [],
        score: { player: 0, opponent: 0 },
        player_answers: [],
        time_left: 30,
        opponent: null,
        rewards: {
          xp_earned: 0,
          coins_earned: 0,
          streak_bonus: 0,
          time_bonus: 0
        },
        time_per_question: 30,
        in_progress: false,
        metadata: {
          is_bot: true,
          difficulty: 'medium',
          mode: 'practice'
        },
        error: null
      },
      battle_stats: battle_stats || {
        total_battles: 0,
        wins: 0,
        losses: 0,
        win_streak: 0,
        highest_streak: 0,
        total_xp_earned: 0,
        total_coins_earned: 0,
        tournaments_played: 0,
        tournaments_won: 0,
        tournament_matches_played: 0,
        tournament_matches_won: 0,
        tournament_rating: 1000,
        difficulty: 1
      },
      inventory,
      activeEffects: [],
      achievements: [],
      quests: { active: [], completed: [] },
      statistics: {
        total_xp: user.xp || 0,
        total_coins: user.coins || 0,
        battles_won: battle_stats?.wins || 0,
        battles_lost: battle_stats?.losses || 0,
        current_streak: battle_stats?.win_streak || 0,
        highest_streak: battle_stats?.highest_streak || 0,
        quests_completed: 0,
        achievements_unlocked: 0
      },
      recentXPGains: [],
      current_levelRewards: [],
      showLevelUpReward: false,
      error: null,
      loading: false,
      syncing: false,
      leaderboard: [],
      battleRatings: {
        user_id,
        rating: 1000,
        wins: 0,
        losses: 0,
        streak: 0,
        highest_streak: 0,
        updated_at: new Date().toISOString()
      },
      login_history: []
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