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
  BattleState,
  BattleStateEnum,
  BattleAction,
  GameAction,
  BattleInitPayload,
  BattleRewards
} from '../types/battle';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { Logger } from '../utils/logger';
import { CircuitBreaker } from '../utils/circuitBreaker';
import { ProgressService } from '../services/progressService';
import { LevelSystem } from '../lib/levelSystem';
import { GameState } from '@/contexts/game/types';
import { BattleRatingService } from '../services/battleRatingService';
import { Dispatch } from 'react';

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
  game_mode: 'cards';
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
  difficulty: number;
  updated_at: string;
}

export class BattleService {
  private static logger = new Logger('BattleService');
  private static circuit_breaker = new CircuitBreaker();

  public static async getCurrentGameState(user_id: string): Promise<GameState> {
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user_id)
        .single();

      if (profileError) throw profileError;

      // Fetch battle stats
      const { data: battleStats, error: statsError } = await supabase
        .from('battle_stats')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (statsError && statsError.code !== 'PGRST116') throw statsError;

      // Fetch active battle if exists
      const { data: activeBattle, error: battleError } = await supabase
        .from('active_battles')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (battleError && battleError.code !== 'PGRST116') throw battleError;

      return {
        user: profile,
        battle: activeBattle ? {
          status: activeBattle.status,
          score: activeBattle.score,
          player_role: activeBattle.player_role,
          opponent_role: activeBattle.opponent_role,
          current_round: activeBattle.current_round,
          total_rounds: activeBattle.total_rounds,
          last_played_cards: activeBattle.last_played_cards,
          in_progress: activeBattle.in_progress,
          error: null,
          rewards: activeBattle.rewards,
          metadata: activeBattle.metadata
        } : null,
        battle_stats: battleStats || {
          total_battles: 0,
          wins: 0,
          losses: 0,
          win_streak: 0,
          highest_streak: 0,
          total_xp_earned: 0,
          total_coins_earned: 0,
          difficulty: 1
        },
        recentXPGains: [],
        leaderboard: [],
        login_history: [],
        achievements: [],
        quests: {
          active: [],
          completed: []
        },
        inventory: {
          items: [],
          equipped: []
        },
        statistics: {
          total_xp: profile.xp || 0,
          total_coins: profile.coins || 0,
          battles_won: battleStats?.wins || 0,
          battles_lost: battleStats?.losses || 0,
          current_streak: battleStats?.win_streak || 0,
          highest_streak: battleStats?.highest_streak || 0,
          quests_completed: 0,
          achievements_unlocked: 0
        },
        error: null,
        loading: false,
        syncing: false,
        showLevelUpReward: false,
        current_levelRewards: [],
        activeEffects: []
      };
    } catch (error) {
      console.error('Error fetching game state:', error);
      throw error;
    }
  }

  public static async handleBattleStateUpdate(
    battleState: BattleState,
    action: GameAction,
    dispatch: Dispatch<GameAction>
  ): Promise<void> {
    try {
      switch (action.type) {
        case 'UPDATE_BATTLE_PROGRESS':
          if (action.payload.playerCard && action.payload.opponentCard) {
            const { playerCard, opponentCard } = action.payload;
            let newScore = { ...battleState.score };
            
            // Compare FORÇA first
            if (playerCard.forca > opponentCard.forca) {
              newScore.player += 1;
            } else if (opponentCard.forca > playerCard.forca) {
              newScore.opponent += 1;
            } else {
              // If FORÇA is equal, compare PODER
              if (playerCard.poder > opponentCard.poder) {
                newScore.player += 1;
              } else if (opponentCard.poder > playerCard.poder) {
                newScore.opponent += 1;
              }
              // If both are equal, no points awarded
            }

            // Update active battle in database
            await supabase
              .from('active_battles')
              .upsert({
                user_id: battleState.user_id,
                status: newScore.player >= 3 || newScore.opponent >= 3 
                  ? BattleStateEnum.COMPLETED 
                  : BattleStateEnum.CARD_SELECTION,
                score: newScore,
                current_round: battleState.current_round + 1,
                last_played_cards: {
                  player: playerCard,
                  opponent: opponentCard
                }
              });

            // If battle is completed, record results
            if (newScore.player >= 3 || newScore.opponent >= 3) {
              const victory = newScore.player >= 3;
              const rewards = {
                xp_earned: victory ? 100 : 50,
                coins_earned: victory ? 50 : 25,
                streak_bonus: victory ? 10 : 0,
                time_bonus: 0
              };

              await this.record_battle_results(
                battleState.user_id,
                battleState,
                victory,
                rewards
              );

              dispatch({
                type: 'END_BATTLE',
                payload: {
                  status: BattleStateEnum.COMPLETED,
                  score: newScore,
                  rewards
                }
              });
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error updating battle state:', error);
      throw error;
    }
  }

  private static async record_battle_results(
    user_id: string,
    battle_state: BattleState,
    victory: boolean,
    rewards: BattleRewards
  ): Promise<void> {
    try {
      // Record battle history
      await supabase
        .from('battle_history')
        .insert({
          user_id,
          opponent_id: null,
          winner_id: victory ? user_id : null,
          score_player: battle_state.score.player,
          score_opponent: battle_state.score.opponent,
          xp_earned: rewards.xp_earned,
          coins_earned: rewards.coins_earned,
          streak_bonus: rewards.streak_bonus,
          is_bot_opponent: true,
          game_mode: 'cards'
        });

      // Update battle stats
      const { data: stats } = await supabase
        .from('battle_stats')
        .select('*')
        .eq('user_id', user_id)
        .single();

      const updatedStats = {
        user_id,
        total_battles: (stats?.total_battles || 0) + 1,
        wins: (stats?.wins || 0) + (victory ? 1 : 0),
        losses: (stats?.losses || 0) + (victory ? 0 : 1),
        win_streak: victory ? (stats?.win_streak || 0) + 1 : 0,
        highest_streak: victory 
          ? Math.max(stats?.highest_streak || 0, (stats?.win_streak || 0) + 1)
          : stats?.highest_streak || 0,
        total_xp_earned: (stats?.total_xp_earned || 0) + rewards.xp_earned,
        total_coins_earned: (stats?.total_coins_earned || 0) + rewards.coins_earned,
        difficulty: stats?.difficulty || 1,
        updated_at: new Date().toISOString()
      };

      await supabase
        .from('battle_stats')
        .upsert(updatedStats);

      // Update user profile
      await supabase
        .from('profiles')
        .update({
          xp: supabase.raw(`xp + ${rewards.xp_earned}`),
          coins: supabase.raw(`coins + ${rewards.coins_earned}`)
        })
        .eq('id', user_id);

      // Clear active battle
      await supabase
        .from('active_battles')
        .delete()
        .eq('user_id', user_id);

    } catch (error) {
      console.error('Error recording battle results:', error);
      throw error;
    }
  }
}