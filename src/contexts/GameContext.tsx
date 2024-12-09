import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { BattleState, BattleStatus, initialBattleState, BotOpponent as BattleOpponent, DBbattle_stats, BattleRatings } from '../types/battle';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { Achievement } from '../types/achievements';
import { Reward } from '../types/rewards';
import type { GameStatistics as ImportedGameStatistics } from '../types/game';
import { BattleService } from '../services/battleService';
import { StatsService } from '../services/statsService';
import { InventoryItem } from '../types';
import { 
  calculate_level, 
  calculate_xp_for_next_level,
  calculate_xp_progress,
  update_streak_multiplier
} from '../utils/gameUtils';
import { Quest } from '../types/quests';
import { UserProgressQueryResult } from '../types/progress';
import { notifyAchievementUnlock } from '../utils/notifications';
import { handleQuestAction } from './game/questReducer';
import type { GameAction as ImportedGameAction } from './game/types';
import { Trophy } from 'lucide-react';
import type { User } from '../types/user';
import { GameState as ImportedGameState } from './game/types';  // Rename to avoid conflict

interface LocalGameStatistics {
  items: any[];
  login_history: any[];
  recentXPGains: any[];
  leaderboard: any[];
  statistics: any;
  syncing: boolean;
  debugMode: boolean;
  lastLevelUpRewards: any[];
  activeUsers: number;
  completedQuests: number;
  purchasedItems: number;
  battlesPlayed: number;
  battlesWon: number;
  averageScore: number;
  lastUpdated: string;
  recentActivity: any[];
}

// Define GameState interface here
interface GameState {
  user: User;
  battle?: BattleState;
  battle_stats?: DBbattle_stats;
  battleRatings?: BattleRatings;
  achievements: Achievement[];
  quests: {
    active: Quest[];
    completed: Quest[];
  };
  completedQuests: string[];
  items: InventoryItem[];
  statistics: LocalGameStatistics;
  syncing: boolean;
  debugMode: boolean;
  lastLevelUpRewards: Reward[];
  roles: string[];
  rewardMultipliers: Record<string, number>;
  constitutionalScore: number;
  civilScore: number;
  criminalScore: number;
  administrativeScore: number;
  login_history: any[];
  recentXPGains: any[];
  leaderboard: any;
}

type LocalGameAction = 
  // Battle Actions
  | { type: 'SET_BATTLE_STATUS'; payload: BattleStatus }
  | { type: 'UPDATE_QUEST_progress'; payload: { active: Quest[]; completed: Quest[] } }
  | { type: 'INITIALIZE_BATTLE'; payload: { 
      questions: any[]; 
      time_per_question: number;
      opponent: BattleOpponent;
    }}
  | { type: 'UPDATE_BATTLE_PROGRESS'; payload: any }
  | { type: 'END_BATTLE'; payload: any }
  | { type: 'RESET_BATTLE' }
  | { type: 'UPDATE_BATTLE_SCORE'; payload: { player: number; opponent: number; is_correct: boolean } }
  | { type: 'NEXT_BATTLE_QUESTION'; payload: null }
  // User Actions
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<User> }
  | { type: 'ADD_XP'; payload: { amount: number; source: string } }
  | { type: 'ADD_COINS'; payload: { amount: number; source: string } }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: Achievement }
  | { type: 'CLAIM_REWARD'; payload: Reward }
  | { type: 'UPDATE_USER_STATS'; payload: { xp: number; coins: number; streak: number } }
  | { type: 'UPDATE_BATTLE_STATS'; payload: Partial<DBbattle_stats> }
  | { type: 'LEVEL_UP'; payload: { level: number; rewards: Reward[] } }
  | { type: 'SYNC_STATISTICS'; payload: LocalGameStatistics }
  | { type: 'UPDATE_STREAK_MULTIPLIER' }
  | { type: 'COMPLETE_QUEST'; payload: { quest_id: string; rewards: Reward[] } }
  | { type: 'ANSWER_QUESTION'; payload: { is_correct: boolean } }
  | { type: 'UPDATE_USER_PROGRESS'; payload: Partial<User> }
  
  | { type: 'UPDATE_QUIZ_STATS'; payload: Partial<any> }
  | { type: 'ADD_ACHIEVEMENT'; payload: Achievement }
  | { type: 'UPDATE_ACHIEVEMENT'; payload: Partial<Achievement> }
  | { type: 'UPDATE_LOGIN_STREAK'; payload: Partial<any> }
  // Premium Actions
  | { type: 'PURCHASE_ITEM'; payload: { item_id: string; cost: number } }
  | { type: 'UPDATE_STUDY_TIME'; payload: { today: number; total: number } }
  | { type: 'CLAIM_DAILY_REWARD'; payload: { reward_value: number; reward_type: string } }
  | { type: 'UPDATE_DAILY_STREAK'; payload: { streak: number; multiplier: number } }
  | { type: 'UPDATE_USER_PROGRESS'; payload: UserProgressQueryResult }
  | { type: 'EQUIP_ITEM'; payload: { item_id: string } }
  | { type: 'UNEQUIP_ITEM'; payload: { item_id: string } }
  | { type: 'UPDATE_ITEM'; payload: InventoryItem }
  | { type: 'ADD_ITEM'; payload: InventoryItem }
  | { type: 'UPDATE_COINS'; payload: number }

type GameAction = ImportedGameAction | LocalGameAction;

export type GameDispatch = React.Dispatch<GameAction>;

interface GameContextType {
  state: GameState;
  dispatch: GameDispatch;
  getCurrentQuestion: () => any;
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
  initialize_battle: () => Promise<void>;
  handle_battle_answer: (answer: string) => Promise<void>;
}

export const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<any>;
}>({
  state: {
    user: {
      id: '',
      name: '',
      email: '',
      created_at: '',
      updated_at: '',
      is_online: false,
      rating: 0,
      level: 1,
      xp: 0,
      coins: 0,
      streak: 0,
      achievements: [],
      inventory: [],
      backpack: [],
      stats: {
        matches_played: 0,
        matches_won: 0,
        tournaments_played: 0,
        tournaments_won: 0,
        win_rate: 0,
        average_score: 0,
        highest_score: 0,
        current_streak: 0,
        best_streak: 0,
        total_correct_answers: 0,
        total_questions_answered: 0,
        accuracy_rate: 0,
        fastest_answer_time: 0,
        average_answer_time: 0
      },
      roles: [],
      rewardMultipliers: {},
      constitutionalScore: 0,
      civilScore: 0,
      criminalScore: 0,
      administrativeScore: 0
    },
    achievements: [],
    quests: {
      active: [],
      completed: []
    },
    completedQuests: [],
    items: [],
    statistics: {
      items: [],
      login_history: [],
      recentXPGains: [],
      leaderboard: [],
      statistics: null,
      syncing: false,
      debugMode: false,
      lastLevelUpRewards: [],
      activeUsers: 0,
      completedQuests: 0,
      purchasedItems: 0,
      battlesPlayed: 0,
      battlesWon: 0,
      averageScore: 0,
      lastUpdated: '',
      recentActivity: []
    },
    syncing: false,
    debugMode: false,
    lastLevelUpRewards: [],
    roles: [],
    rewardMultipliers: {},
    constitutionalScore: 0,
    civilScore: 0,
    criminalScore: 0,
    administrativeScore: 0,
    login_history: [],
    recentXPGains: [],
    leaderboard: {
      score: 0,
      updated_at: new Date().toISOString()
    }
  },
  dispatch: () => null
});

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuth();
  const [state, dispatch] = useReducer(game_reducer, initialState);

  // Sync user state with auth state
  useEffect(() => {
    if (authUser) {
      dispatch({
        type: 'UPDATE_USER_PROFILE',
        payload: {
          id: authUser.id,
          email: authUser.email,
          name: authUser.name,
          roles: authUser.roles,
          level: authUser.level || 1,
          xp: authUser.xp || 0,
          coins: authUser.coins || 0,
          streak: authUser.streak || 0,
          battle_rating: authUser.battle_rating || BATTLE_CONFIG.matchmaking.default_rating
        }
      });

      // Initialize battle stats if not exists
      const fetchbattle_stats = async () => {
        const { data: battle_stats, error } = await supabase
          .from('battle_stats')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        if (error) {
          console.error('Error fetching battle stats:', error);
        } else if (!battle_stats) {
          supabase.from('battle_stats').insert({
            user_id: authUser.id,
            total_battles: 0,
            wins: 0,
            losses: 0,
            win_streak: 0,
            highest_streak: 0,
            total_xp_earned: 0,
            total_coins_earned: 0,
            updated_at: new Date().toISOString()
          });

          // Initialize battle ratings separately
          supabase.from('battle_ratings').insert({
            user_id: authUser.id,
            rating: BATTLE_CONFIG.matchmaking.default_rating,
            wins: 0,
            losses: 0,
            streak: 0,
            highest_streak: 0,
            updated_at: new Date().toISOString()
          });
        }
      };

      fetchbattle_stats();
    }
  }, [authUser]);

  // Sync with database whenever relevant state changes
  useEffect(() => {
    if (state.user?.id) {
      update_user_progress(state.user.id, {
        xp: state.user.xp,
        coins: state.user.coins,
        level: state.user.level,
        streak: state.user.streak,
        battle_stats: state.battle_stats ? {
          total_battles: state.battle_stats.wins + state.battle_stats.losses,
          wins: state.battle_stats.wins,
          losses: state.battle_stats.losses,
          win_streak: state.battle_stats.win_streak,
          highest_streak: state.battle_stats.highest_streak,
          total_xp_earned: state.battle_stats.total_xp_earned,
          total_coins_earned: state.battle_stats.total_coins_earned,
          updated_at: new Date().toISOString()
        } : undefined
      });
    }
  }, [state.user?.xp, state.user?.coins, state.user?.level, state.user?.streak, state.battle_stats]);

  const update_user_progress = async (userId: string, progress: any) => {
    try {
      // First fetch existing progress
      const { data: existingProgress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingProgress) {
        // Update existing record
        const { error: progressError } = await supabase
          .from('user_progress')
          .update({
            xp: progress.xp,
            level: progress.level,
            coins: progress.coins,
            streak: progress.streak,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (progressError) {
          console.error('Error updating user progress:', progressError);
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('user_progress')
          .insert({
            user_id: userId,
            xp: progress.xp,
            level: progress.level,
            coins: progress.coins,
            streak: progress.streak,
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error inserting user progress:', insertError);
        }
      }

      // Update battle stats separately
      if (progress.battle_stats) {
        const { data: existingStats } = await supabase
          .from('battle_stats')
          .select('*')
          .eq('user_id', userId)
          .single();

        const statsData = {
          user_id: userId,
          ...progress.battle_stats,
          // Preserve existing totals if they exist
          total_xp_earned: existingStats 
            ? existingStats.total_xp_earned + (progress.battle_stats.total_xp_earned || 0)
            : progress.battle_stats.total_xp_earned || 0,
          total_coins_earned: existingStats
            ? existingStats.total_coins_earned + (progress.battle_stats.total_coins_earned || 0)
            : progress.battle_stats.total_coins_earned || 0
        };

        if (existingStats) {
          // Update existing stats
          const { error: statsError } = await supabase
            .from('battle_stats')
            .update(statsData)
            .eq('user_id', userId);

          if (statsError) {
            console.error('Error updating battle stats:', statsError);
          }
        } else {
          // Insert new stats
          const { error: statsError } = await supabase
            .from('battle_stats')
            .insert(statsData);

          if (statsError) {
            console.error('Error inserting battle stats:', statsError);
          }
        }
      }
    } catch (err) {
      console.error('Error in update_user_progress:', err);
    }
  };

  const initialize_battle = async () => {
    try {
      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'idle' });

      const questions = await BattleService.fetch_battle_questions();
      
      dispatch({
        type: 'INITIALIZE_BATTLE',
        payload: {
          questions,
          time_per_question: BATTLE_CONFIG.time_per_question,
          opponent: {
            id: 'bot-' + Date.now(),
            name: 'Bot Opponent',
            rating: BATTLE_CONFIG.matchmaking.default_rating,
            is_bot: true
          }
        }
      });

      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'active' });
      
      // Short delay before starting battle
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error('Battle initialization failed:', error);
      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'error' });
    }
  };

  const handle_battle_answer = async (answer: string) => {
    if (!state.battle || !state.user) return;

    try {
      const currentQuestion = state.battle.questions[state.battle.current_question];
      if (!currentQuestion) return;

      // Convert numeric answer (0-3) to letter (A-D)
      const answerMap: Record<string, 'A' | 'B' | 'C' | 'D'> = {
        '0': 'A',
        '1': 'B',
        '2': 'C',
        '3': 'D'
      };
      
      const letterAnswer = answerMap[answer];
      const isCorrect = letterAnswer === currentQuestion.correct_answer;
      
      // Simulate opponent answer with 60% chance of being correct
      const opponentCorrect = Math.random() > 0.4;
      
      dispatch({
        type: 'UPDATE_BATTLE_PROGRESS',
        payload: {
          playerScore: state.battle.score.player + (isCorrect ? 1 : 0),
          opponentScore: state.battle.score.opponent + (opponentCorrect ? 1 : 0),
          currentQuestion: state.battle.current_question + 1,
          timeLeft: BATTLE_CONFIG.time_per_question,
          isCorrect: isCorrect
        }
      });

      // If this was the last question, end the battle
      if (state.battle.current_question >= state.battle.questions.length - 1) {
        const finalPlayerScore = state.battle.score.player + (isCorrect ? 1 : 0);
        const finalopponent_score = state.battle.score.opponent + (opponentCorrect ? 1 : 0);
        const isVictory = finalPlayerScore > finalopponent_score;

        // Calculate rewards
        const base_xp = BATTLE_CONFIG.progress.base_xp;
        const xpEarned = Math.round(base_xp * (isCorrect ? 1 : 0));
        const coinsEarned = Math.round(BATTLE_CONFIG.progress.base_coins * (isCorrect ? 1 : 0));
        const streak_bonus = isVictory ? (state.user.streak * BATTLE_CONFIG.rewards.streak_bonus.multiplier) : 0;
        const timeBonus = state.battle.time_left * BATTLE_CONFIG.rewards.time_bonus.multiplier;

        // Calculate total rewards including time bonus
        const totalXpEarned = xpEarned + timeBonus;
        const totalCoinsEarned = coinsEarned + Math.round(timeBonus * BATTLE_CONFIG.rewards.time_bonus.multiplier || 0);

        // Update battle state
        const updatedBattle: BattleState = {
          ...state.battle,
          status: 'completed',
          in_progress: false,
          questions: state.battle.questions,
          current_question: state.battle.current_question,
          score: {
            player: state.battle.score.player + (isCorrect ? 1 : 0),
            opponent: state.battle.score.opponent + (opponentCorrect ? 1 : 0)
          },
          time_per_question: state.battle.time_per_question,
          time_left: state.battle.time_left,
          player_answers: [...state.battle.player_answers, isCorrect],  // Track answer in playerAnswers array
          opponent: state.battle.opponent,
          rewards: {
            xp_earned: totalXpEarned,
            coins_earned: totalCoinsEarned,
            streak_bonus: streak_bonus,
            time_bonus: timeBonus
          }
        };

        // Update user stats
        dispatch({
          type: 'UPDATE_USER_STATS',
          payload: {
            xp: state.user.xp + totalXpEarned,
            coins: state.user.coins + totalCoinsEarned,
            streak: isVictory ? state.user.streak + 1 : 0
          }
        });

        // Persist user stats to profiles table
        try {
          // Calculate new level based on XP
          const currentXp = state.user.xp + totalXpEarned;
          const newLevel = Math.floor(Math.pow(currentXp / BATTLE_CONFIG.progress.base_xp, 1 / BATTLE_CONFIG.progress.growth_factor));

          // Update profiles table with all stats
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              xp: currentXp,
              level: newLevel,
              coins: state.user.coins + totalCoinsEarned,
              streak: isVictory ? state.user.streak + 1 : 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', state.user.id);

          if (profileError) {
            console.error('Error updating profile stats:', profileError);
          }

          // Update battle_stats table
          const { error: battleStatsError } = await supabase
            .from('battle_stats')
            .upsert({
              user_id: state.user.id,
              total_battles: (state.battle_stats?.total_battles || 0) + 1,
              wins: (state.battle_stats?.wins || 0) + (isVictory ? 1 : 0),
              losses: (state.battle_stats?.losses || 0) + (isVictory ? 0 : 1),
              win_streak: isVictory ? (state.battle_stats?.win_streak || 0) + 1 : 0,
              highest_streak: Math.max(
                state.battle_stats?.highest_streak || 0,
                isVictory ? (state.battle_stats?.win_streak || 0) + 1 : 0
              ),
              total_xp_earned: (state.battle_stats?.total_xp_earned || 0) + totalXpEarned,
              total_coins_earned: (state.battle_stats?.total_coins_earned || 0) + totalCoinsEarned,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });

          if (battleStatsError) {
            console.error('Error updating battle stats:', battleStatsError);
          }

          // Record battle in battle_history
          const { error: battleHistoryError } = await supabase
            .from('battle_history')
            .insert({
              user_id: state.user.id,
              opponent_id: state.battle.opponent?.id || 'unknown',
              winner_id: isVictory ? state.user.id : (state.battle.opponent?.id || 'unknown'),
              score_player: state.battle.score.player,
              score_opponent: state.battle.score.opponent,
              xp_earned: totalXpEarned,
              coins_earned: totalCoinsEarned,
              streak_bonus: streak_bonus,
              is_bot_opponent: state.battle.opponent?.is_bot || true,
              created_at: new Date().toISOString()
            });

          if (battleHistoryError) {
            console.error('Error recording battle history:', battleHistoryError);
          }
        } catch (error) {
          console.error('Error persisting game stats:', error);
        }

        // Update local battle stats
        dispatch({
          type: 'UPDATE_BATTLE_STATS',
          payload: {
            total_battles: (state.battle_stats?.total_battles || 0) + 1,
            wins: (state.battle_stats?.wins || 0) + (isVictory ? 1 : 0),
            losses: (state.battle_stats?.losses || 0) + (isVictory ? 0 : 1),
            win_streak: isVictory ? (state.battle_stats?.win_streak || 0) + 1 : 0,
            highest_streak: Math.max(
              state.battle_stats?.highest_streak || 0,
              isVictory ? (state.battle_stats?.win_streak || 0) + 1 : 0
            ),
            total_xp_earned: (state.battle_stats?.total_xp_earned || 0) + totalXpEarned,
            total_coins_earned: (state.battle_stats?.total_coins_earned || 0) + totalCoinsEarned
          }
        });

        // Update game state
        dispatch({
          type: 'END_BATTLE',
          payload: {
            status: updatedBattle.status as BattleStatus,
            score: {
              player: updatedBattle.score.player,
              opponent: updatedBattle.score.opponent
            },
            rewards: updatedBattle.rewards || {
              xp_earned: 0,
              coins_earned: 0,
              streak_bonus: 0,
              time_bonus: 0
            }
          }
        });

        // Busca os dados atualizados do usuário parasincronizar com o frontend
        const { data: updated_user_progress, error: updated_progress_error } = await supabase
          .from('user_progress')
          .select(`*, battle_stats(*)`)
          .eq('user_id', state.user.id)
          .single<UserProgressQueryResult>();
        
        if (updated_progress_error) throw new Error(`Failed to fetchupdated user progress: ${updated_progress_error.message}`);
        if (!updated_user_progress) throw new Error('Updated user progressnot found');
        
        // Atualiza o estado global com os dados atualizadosdo usuário
        dispatch({ type: 'UPDATE_USER_PROGRESS', payload: updated_user_progress });
      }
    } catch (error) {
      console.error('Error handling battle answer:', error);
    }
  };

  // Initialize real-time updates
  useEffect(() => {
    if (state.user?.id) {
      const statsService = new StatsService(dispatch, state.user.id);
      statsService.initializeSubscriptions();

      return () => {
        statsService.cleanup();
      };
    }
  }, [state.user?.id]);

  // Battle utility functions
  const getCurrentQuestion = useCallback(() => {
    if (!state.battle?.questions || typeof state.battle.current_question !== 'number') {
      return null;
    }
    return state.battle.questions[state.battle.current_question];
  }, [state.battle]);

  const getBattleStatus = useCallback(() => {
    return state.battle?.status || 'idle';
  }, [state.battle?.status]);

  const getBattleProgress = useCallback(() => {
    return {
      currentQuestion: state.battle?.current_question || 0,
      totalQuestions: state.battle?.questions?.length || 0,
      timeLeft: state.battle?.time_left || 0,
      score: state.battle?.score || { player: 0, opponent: 0 }
    };
  }, [state.battle]);

  const getRewards = useCallback(() => {
    return {
      xpEarned: state.battle?.rewards?.xp_earned || 0,
      coinsEarned: state.battle?.rewards?.coins_earned || 0,
      streak_bonus: state.battle?.rewards?.streak_bonus || 0,
      timeBonus: state.battle?.rewards?.time_bonus || 0
    };
  }, [state.battle?.rewards]);

  const contextValue: GameContextType = {
    state,
    dispatch,
    getCurrentQuestion,
    getBattleStatus,
    getBattleProgress,
    getRewards,
    initialize_battle,
    handle_battle_answer
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

const initialState: GameState = {
  user: {
    id: '',
    name: '',
    email: '',
    created_at: '',
    updated_at: '',
    is_online: false,
    rating: 0,
    level: 1,
    xp: 0,
    coins: 0,
    streak: 0,
    achievements: [],
    inventory: [],
    backpack: [],
    stats: {
      matches_played: 0,
      matches_won: 0,
      tournaments_played: 0,
      tournaments_won: 0,
      win_rate: 0,
      average_score: 0,
      highest_score: 0,
      current_streak: 0,
      best_streak: 0,
      total_correct_answers: 0,
      total_questions_answered: 0,
      accuracy_rate: 0,
      fastest_answer_time: 0,
      average_answer_time: 0
    },
    roles: [],
    rewardMultipliers: {},
    constitutionalScore: 0,
    civilScore: 0,
    criminalScore: 0,
    administrativeScore: 0
  },
  achievements: [],
  quests: {
    active: [],
    completed: []
  },
  completedQuests: [],
  items: [],
  statistics: {
    items: [],
    login_history: [],
    recentXPGains: [],
    leaderboard: [],
    statistics: null,
    syncing: false,
    debugMode: false,
    lastLevelUpRewards: [],
    activeUsers: 0,
    completedQuests: 0,
    purchasedItems: 0,
    battlesPlayed: 0,
    battlesWon: 0,
    averageScore: 0,
    lastUpdated: '',
    recentActivity: []
  },
  syncing: false,
  debugMode: false,
  lastLevelUpRewards: [],
  roles: [],
  rewardMultipliers: {},
  constitutionalScore: 0,
  civilScore: 0,
  criminalScore: 0,
  administrativeScore: 0,
  login_history: [],
  recentXPGains: [],
  leaderboard: {
    score: 0,
    updated_at: new Date().toISOString()
  }
};

function game_reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_BATTLE_STATUS': {
      if (!state.battle) {
        console.error('[GameContext] Cannot set battle status: No battle state exists');
        return state;
      }

      const status = action.payload;
      // Validate state before transitioning
      if (status === 'active') {
        if (!Array.isArray(state.battle.questions) || state.battle.questions.length === 0) {
          console.error('[GameContext] Cannot transition to active state: No questions available', {
            questions: state.battle.questions,
            current_status: state.battle.status,
            target_status: status
          });
          return state;
        }

        if (!state.battle.opponent) {
          console.error('[GameContext] Cannot transition to active state: No opponent set', {
            current_status: state.battle.status,
            opponent: state.battle.opponent
          });
          return state;
        }

        if (typeof state.battle.current_question !== 'number') {
          console.error('[GameContext] Cannot transition to active state: Invalid question index', {
            current_question: state.battle.current_question
          });
          return state;
        }
      }

      return {
        ...state,
        battle: {
          ...state.battle,
          status,
          time_left: status === 'active' 
            ? BATTLE_CONFIG.time_per_question 
            : state.battle.time_left,
          in_progress: status === 'active'
        }
      };
    }

    case 'INITIALIZE_BATTLE': {
      if (!Array.isArray(action.payload.questions) || action.payload.questions.length === 0) {
        console.error('[GameContext] Cannot initialize battle: Invalid or empty questions array', {
          questions: action.payload.questions
        });
        return state;
      }

      if (!action.payload.opponent) {
        console.error('[GameContext] Cannot initialize battle: No opponent provided', {
          opponent: action.payload.opponent
        });
        return state;
      }

      const time_per_question = action.payload.time_per_question || BATTLE_CONFIG.time_per_question;

      const initialized_state: BattleState = {
        ...initialBattleState,
        status: 'active',
        questions: [...action.payload.questions],
        time_per_question,
        opponent: action.payload.opponent,
        current_question: 0,
        score: { player: 0, opponent: 0 },
        player_answers: [],
        time_left: time_per_question,
        in_progress: false,
        rewards: {
          xp_earned: 0,
          coins_earned: 0,
          streak_bonus: 0,
          time_bonus: BATTLE_CONFIG.rewards.time_bonus.multiplier
        }
      };

      console.log('[GameContext] Battle initialized with state:', {
        status: initialized_state.status,
        current_question: initialized_state.current_question,
        question_count: initialized_state.questions.length,
        opponent: initialized_state.opponent
      });

      return {
        ...state,
        battle: initialized_state
      };
    }

    case 'UPDATE_BATTLE_PROGRESS': {
      if (!state.battle) return state;
      
      const { playerScore, opponentScore, currentQuestion, timeLeft, isCorrect } = action.payload;
      
      // Only calculate rewards if battle is not already completed
      if (currentQuestion >= state.battle.questions.length && state.battle.status !== 'completed') {
        const isVictory = playerScore > opponentScore;
        const base_xp = BATTLE_CONFIG.progress.base_xp;
        const xpEarned = Math.round(base_xp * (playerScore / state.battle.questions.length));
        const coinsEarned = Math.round(BATTLE_CONFIG.progress.base_coins * (playerScore / state.battle.questions.length));
        const streak_bonus = isVictory ? (state.user.streak * BATTLE_CONFIG.rewards.streak_bonus.multiplier) : 0;
        const timeBonus = Math.round(timeLeft * BATTLE_CONFIG.rewards.time_bonus.multiplier);

        // Calculate total rewards including time bonus
        const totalXpEarned = xpEarned + timeBonus;
        const totalCoinsEarned = coinsEarned + Math.round(timeBonus * BATTLE_CONFIG.rewards.time_bonus.multiplier || 0);

        return {
          ...state,
          battle: {
            ...state.battle,
            status: 'completed',
            score: { player: playerScore, opponent: opponentScore },
            current_question: currentQuestion,
            time_left: timeLeft,
            rewards: {
              xp_earned: totalXpEarned,
              coins_earned: totalCoinsEarned,
              streak_bonus: streak_bonus,
              time_bonus: timeBonus
            }
          }
        };
      }

      // Just update battle progress if not completed
      return {
        ...state,
        battle: {
          ...state.battle,
          score: { player: playerScore, opponent: opponentScore },
          current_question: currentQuestion,
          time_left: timeLeft
        }
      };
    }

    case 'END_BATTLE': {
      if (!state.battle || !action.payload) {
        console.error('[GameContext] Cannot end battle: Invalid state or payload');
        return state;
      }

      const { status, score, rewards } = action.payload;
      const totalXpEarned = (rewards?.xp_earned || 0) + (rewards?.streak_bonus || 0) + (rewards?.time_bonus || 0);

      // Add type guard for battle_stats
      const getBattleStats = (state: GameState): DBbattle_stats => {
        if (!state.battle_stats) {
          return {
            user_id: state.user.id,
            total_battles: 0,
            wins: 0,
            losses: 0,
            win_streak: 0,
            highest_streak: 0,
            total_xp_earned: 0,
            total_coins_earned: 0,
            updated_at: new Date().toISOString(),
            difficulty: 1
          };
        }
        return state.battle_stats;
      };

      return {
        ...state,
        battle: {
          ...state.battle,
          status: status || 'completed',
          score,
          rewards,
          in_progress: false
        },
        user: {
          ...state.user,
          xp: state.user.xp + totalXpEarned,
          coins: state.user.coins + (rewards?.coins_earned || 0),
          streak: rewards?.streak_bonus > 0 ? state.user.streak + 1 : 0
        },
        battle_stats: {
          ...getBattleStats(state),
          total_battles: getBattleStats(state).total_battles + 1,
          wins: score.player > score.opponent ? getBattleStats(state).wins + 1 : getBattleStats(state).wins,
          losses: score.player < score.opponent ? getBattleStats(state).losses + 1 : getBattleStats(state).losses,
          win_streak: score.player > score.opponent ? getBattleStats(state).win_streak + 1 : 0,
          total_xp_earned: getBattleStats(state).total_xp_earned + totalXpEarned,
          total_coins_earned: getBattleStats(state).total_coins_earned + (rewards?.coins_earned || 0),
          updated_at: new Date().toISOString()
        }
      };
    }

    case 'RESET_BATTLE': {
      return {
        ...state,
        battle: {
          ...initialBattleState,
          status: 'idle',
          current_question: 0,
          questions: [],
          score: { player: 0, opponent: 0 },
          player_answers: [],
          time_left: BATTLE_CONFIG.time_per_question,
          time_per_question: BATTLE_CONFIG.time_per_question,
          in_progress: false,
          opponent: {
            id: 'bot-0',
            name: 'Bot',
            is_bot: true
          },
          rewards: {
            xp_earned: 0,
            coins_earned: 0,
            streak_bonus: 0,
            time_bonus: 0
          }
        }
      };
    }

    case 'ANSWER_QUESTION': {
      if (!state.battle || state.battle.status !== 'active') {
        return state;
      }

      const isCorrect = 'is_correct' in action.payload 
        ? action.payload.is_correct 
        : action.payload.isCorrect;

      const current_question = state.battle.current_question;
      const total_questions = state.battle.questions.length;

      // Update player answers and score
      const new_player_answers = [...state.battle.player_answers, isCorrect];
      const new_player_score = new_player_answers.filter(answer => answer).length;

      // Simulate opponent answer (60% chance of correct)
      const opponent_correct = Math.random() > 0.4;
      const new_opponent_score = state.battle.score.opponent + (opponent_correct ? 1 : 0);

      // Check if battle is complete
      const is_battle_complete = current_question + 1 >= total_questions;

      if (is_battle_complete) {
        const is_victory = new_player_score > new_opponent_score;
        
        // Calculate final rewards
        const base_xp = BATTLE_CONFIG.progress.base_xp;
        const xp_earned = Math.round(base_xp * (new_player_score / total_questions));
        const coins_earned = Math.round(BATTLE_CONFIG.progress.base_coins * (new_player_score / total_questions));
        const streak_bonus = is_victory ? Math.round(state.user.streak * BATTLE_CONFIG.rewards.streak_bonus.multiplier) : 0;
        const time_bonus = Math.round(state.battle.time_left * BATTLE_CONFIG.rewards.time_bonus.multiplier);

        // Calculate total rewards including time bonus
        const totalXpEarned = xp_earned + time_bonus;
        const totalCoinsEarned = coins_earned + Math.round(time_bonus * BATTLE_CONFIG.rewards.time_bonus.multiplier || 0);

        return {
          ...state,
          battle: {
            ...state.battle,
            status: 'completed',
            current_question: current_question + 1,
            player_answers: new_player_answers,
            score: {
              player: new_player_score,
              opponent: new_opponent_score
            },
            rewards: {
              xp_earned: totalXpEarned,
              coins_earned: totalCoinsEarned,
              streak_bonus: streak_bonus,
              time_bonus: time_bonus
            },
            in_progress: false
          }
        };
      }

      // Battle continues
      return {
        ...state,
        battle: {
          ...state.battle,
          current_question: current_question + 1,
          player_answers: new_player_answers,
          score: {
            player: new_player_score,
            opponent: new_opponent_score
          },
          time_left: BATTLE_CONFIG.time_per_question
        }
      };
    }

    case 'UPDATE_USER_PROFILE': {
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload
        }
      };
    }

    case 'ADD_XP': {
      return {
        ...state,
        user: {
          ...state.user,
          xp: state.user.xp + action.payload.amount
        }
      };
    }

    case 'ADD_COINS': {
      return {
        ...state,
        user: {
          ...state.user,
          coins: state.user.coins + action.payload.amount
        }
      };
    }

    case 'CLAIM_REWARD':
      return {
        ...state,
        user: {
          ...state.user,
          ...(action.payload.type === 'xp' && { xp: state.user.xp + Number(action.payload.value) }),
          ...(action.payload.type === 'coins' && { coins: state.user.coins + Number(action.payload.value) })
        }
      };

    case 'UPDATE_USER_STATS':
      const current_level = calculate_level(state.user.xp + action.payload.xp);
      const LEVEL_UP = current_level > state.user.level;
      
      if (LEVEL_UP) {
        const next_level_xp = calculate_xp_for_next_level(current_level);
        const level_progress = calculate_xp_progress(state.user.xp + action.payload.xp, current_level);
        
        // Level up rewards are calculated based on current progression and level
        // This ensures rewards scale appropriately with player advancement
        const LEVEL_UP_rewards: Reward[] = [
          {
            id: `LEVEL_UP_xp_${current_level}`,
            type: 'xp' as const,
            value: Math.floor(next_level_xp * 0.1),
            name: 'XP Bonus',
            description: 'Level up XP bonus',
            amount: 1,
            rarity: 'common' as const
          },
          {
            id: `LEVEL_UP_coins_${current_level}`,
            type: 'coins' as const,
            value: Math.floor(current_level * 100 * (1 + level_progress / 100)),
            name: 'Coin Bonus',
            description: 'Level up coin bonus',
            amount: 1,
            rarity: 'common' as const
          }
        ];

        // Apply level up rewards to user state
        const total_bonus_xp = Number(LEVEL_UP_rewards.find(r => r.type === 'xp')?.value || 0);
        const total_bonus_coins = Number(LEVEL_UP_rewards.find(r => r.type === 'coins')?.value || 0);
        
        return {
          ...state,
          user: {
            ...state.user,
            level: current_level,
            xp: state.user.xp + action.payload.xp + total_bonus_xp,
            coins: state.user.coins + action.payload.coins + total_bonus_coins,
            streak: action.payload.streak
          },
          lastLevelUpRewards: LEVEL_UP_rewards
        };
      }

      return {
        ...state,
        user: {
          ...state.user,
          xp: state.user.xp + action.payload.xp,
          coins: state.user.coins + action.payload.coins,
          streak: action.payload.streak
        }
      };

    case 'UPDATE_BATTLE_STATS': {
      if (!state.battle_stats) return state;
      
      return {
        ...state,
        battle_stats: {
          ...state.battle_stats,
          ...action.payload,
          user_id: state.battle_stats.user_id // Ensure user_id is preserved
        } as DBbattle_stats
      };
    }

    case 'LEVEL_UP': {
      const rewards = Array.isArray(action.payload.rewards) 
        ? action.payload.rewards 
        : [
            {
              id: `LEVEL_UP_xp_${action.payload.level}`,
              type: 'xp' as const,
              value: action.payload.rewards.xp,
              name: 'XP Bonus',
              description: 'Level up XP bonus',
              amount: 1,
            },
            {
              id: `LEVEL_UP_coins_${action.payload.level}`,
              type: 'coins' as const,
              value: action.payload.rewards.coins,
              name: 'Coin Bonus',
              description: 'Level up coin bonus',
              amount: 1,
            }
          ];
      
      return {
        ...state,
        user: {
          ...state.user,
          level: action.payload.level
        },
        lastLevelUpRewards: rewards
      };
    }

    case 'SYNC_STATISTICS': {
      return {
        ...state,
        statistics: {
          ...state.statistics,
          ...action.payload,
          items: action.payload.items || state.statistics.items || [],
          login_history: action.payload.login_history || state.statistics.login_history || [],
          recentXPGains: action.payload.recentXPGains || state.statistics.recentXPGains || [],
          leaderboard: action.payload.leaderboard || state.statistics.leaderboard || [],
          statistics: action.payload.statistics || state.statistics.statistics || null,
          syncing: action.payload.syncing ?? state.statistics.syncing ?? false,
          debugMode: action.payload.debugMode ?? state.statistics.debugMode ?? false,
          lastLevelUpRewards: action.payload.lastLevelUpRewards || state.statistics.lastLevelUpRewards || [],
          activeUsers: action.payload.activeUsers,
          completedQuests: action.payload.completedQuests,
          purchasedItems: action.payload.purchasedItems,
          battlesPlayed: action.payload.battlesPlayed,
          battlesWon: action.payload.battlesWon,
          averageScore: action.payload.averageScore,
          lastUpdated: action.payload.lastUpdated,
          recentActivity: action.payload.recentActivity || []
        }
      };
    }

    case 'UPDATE_STREAK_MULTIPLIER':
      const new_multiplier = update_streak_multiplier(state.user.streak);
      return {
        ...state,
        user: {
          ...state.user,
          streakMultiplier: new_multiplier
        }
      };

    case 'COMPLETE_QUEST': {
      const quest_id = 'quest' in action.payload ? action.payload.quest.id : action.payload.quest_id;
      const rewards = action.payload.rewards;
      return {
        ...state,
        completedQuests: [...state.completedQuests, quest_id],
        user: {
          ...state.user,
          xp: state.user.xp + ('xp' in rewards ? rewards.xp : 0),
          coins: state.user.coins + ('coins' in rewards ? rewards.coins : 0)
        }
      };
    }

    case 'UPDATE_BATTLE_SCORE':
      if (!state.battle) return state;
      
      return {
        ...state,
        battle: {
          ...state.battle,
          score: {
            player: action.payload.player,
            opponent: action.payload.opponent
          },
          player_answers: [...state.battle.player_answers, action.payload.is_correct]  // Store in playerAnswers array
        }
      };

    case 'NEXT_BATTLE_QUESTION':
      if (!state.battle) return state;
      
      return {
        ...state,
        battle: {
          ...state.battle,
          current_question: state.battle.current_question + 1,
          time_left: state.battle.time_per_question
        }
      };

    case 'UPDATE_USER_PROGRESS': {
      const defaultDifficulty = 1;
      const battle_stats = action.payload.battle_stats ? {
        ...action.payload.battle_stats,
        difficulty: (action.payload.battle_stats as any).difficulty ?? defaultDifficulty
      } : state.battle_stats;

      return {
        ...state,
        user: {
          ...state.user,
          xp: action.payload.xp ?? state.user.xp,
          level: action.payload.level ?? state.user.level,
          coins: action.payload.coins ?? state.user.coins,
          streak: action.payload.streak ?? state.user.streak,
          achievements: action.payload.achievements?.map(id => ({
            ...defaultAchievement,
            id: typeof id === 'string' ? id : id.id,
            title: `Achievement ${id}`,
            description: 'Achievement unlocked',
            prerequisites: [],
            dependents: [],
            order: 0
          })) || state.user.achievements
        }
      };
    }

    case 'UPDATE_QUIZ_STATS': {
      return {
        ...state,
        user: {
          ...state.user,
          quiz_stats: {
            total_questions: state.user.quiz_stats?.total_questions ?? 0,
            correct_answers: state.user.quiz_stats?.correct_answers ?? 0,
            accuracy: state.user.quiz_stats?.accuracy ?? 0,
            average_time: state.user.quiz_stats?.average_time ?? 0,
            completed_quizzes: state.user.quiz_stats?.completed_quizzes ?? 0,
            streak: state.user.quiz_stats?.streak ?? 0,
            ...action.payload
          }
        }
      };
    }

    case 'ADD_ACHIEVEMENT':
      return {
        ...state,
        achievements: [...state.achievements, action.payload]
      };

    case 'UPDATE_ACHIEVEMENT':
      return {
        ...state,
        achievements: state.achievements?.map(achievement =>
          achievement.id === action.payload.id
            ? { ...achievement, ...action.payload }
            : achievement
        ) || []
      };

    case 'UPDATE_LOGIN_STREAK':
      return {
        ...state,
        user: {
          ...state.user,
          streak: action.payload.streak || state.user.streak,
          last_login_date: action.payload.last_login_date || state.user.last_login_date
        }
      };

    case 'PURCHASE_ITEM':
      return {
        ...state,
        user: {
          ...state.user,
          coins: state.user.coins - action.payload.cost,
          inventory: [...(state.user.inventory || []), {
            id: action.payload.item_id,
            itemId: action.payload.item_id,
            equipped: false,
            quantity: 1,
            acquired_at: new Date().toISOString(),
            name: action.payload.item_id,
            type: 'consumable',
            rarity: 'common',
            description: '',
            effects: [],
            imageUrl: '',
            stats: {},
            durability: 100,
            level_requirement: 1,
            tags: [],
            cost: action.payload.cost,
            requirements: [],
            metadata: {},
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as InventoryItem]
        }
      };

    case 'UPDATE_QUEST_PROGRESS': {
      const { questId, progress } = action.payload;
      return {
        ...state,
        quests: {
          ...state.quests,
          active: state.quests.active.map(q => 
            q.id === questId ? { ...q, progress } : q
          ),
          completed: state.quests.completed
        },
        completedQuests: state.completedQuests
      };
    }

    case 'UPDATE_STUDY_TIME':
      return {
        ...state,
        user: {
          ...state.user,
          study_time: (state.user.study_time || 0) + action.payload.today
        }
      };

    case 'CLAIM_DAILY_REWARD':
      return {
        ...state,
        user: {
          ...state.user,
          daily_rewards: {
            claimed_today: true,
            streak: state.user.daily_rewards?.streak || 0,
            streak_multiplier: state.user.daily_rewards?.streak_multiplier || 1,
            next_reward: {
              day: state.user.daily_rewards?.streak ? state.user.daily_rewards.streak + 1 : 1,
              rarity: 'common', // Or calculate based on streak
              reward_value: action.payload.reward_value,
              reward_type: action.payload.reward_type
            }
          }
        }
      };

    case 'UPDATE_DAILY_STREAK':
      return {
        ...state,
        user: {
          ...state.user,
          daily_rewards: {
            claimed_today: state.user.daily_rewards?.claimed_today || false,
            streak: action.payload.streak,
            streak_multiplier: action.payload.multiplier,
            next_reward: state.user.daily_rewards?.next_reward || {
              day: 1,
              rarity: 'common',
              reward_value: 0,
              reward_type: 'coins'
            }
          }
        }
      };

    case 'UNLOCK_ACHIEVEMENT': {
      const achievement = action.payload;
      notifyAchievementUnlock(achievement);
      return {
        ...state,
        achievements: state.achievements.map(a => 
          a.id === achievement.id 
            ? { ...a, unlocked: true, unlocked_at: new Date().toISOString() }
            : a
        )
      };
    }

    case 'UPDATE_QUEST': {
      return {
        ...state,
        quests: {
          ...state.quests,
          active: state.quests.active.map(q => 
            q.id === action.payload.id ? action.payload : q
          )
        }
      };
    }

    case 'UPDATE_ITEM': {
      return {
        ...state,
        user: {
          ...state.user,
          inventory: state.user.inventory.map(item => 
            item.id === action.payload.id 
              ? { ...item, ...action.payload } as InventoryItem
              : item
          )
        }
      };
    }

    case 'ADD_ITEM': {
      const newItem: InventoryItem = {
        ...action.payload,
        equipped: false,
        quantity: 1,
        imageUrl: action.payload.imageUrl || ''
      };
      
      return {
        ...state,
        user: {
          ...state.user,
          inventory: [...state.user.inventory, newItem]
        }
      };
    }

    case 'EQUIP_ITEM': {
      const { item_id } = action.payload;
      const updatedInventory = state.user.inventory.map(item => 
        item.id === item_id ? { ...item, equipped: true } : item
      );
      return {
        ...state,
        user: {
          ...state.user,
          inventory: updatedInventory,
          backpack: [...state.user.backpack, state.user.inventory.find(i => i.id === item_id)!]
        }
      };
    }

    case 'UNEQUIP_ITEM': {
      const { item_id } = action.payload;
      const updatedInventory = state.user.inventory.map(item => 
        item.id === item_id ? { ...item, equipped: false } : item
      );
      return {
        ...state,
        user: {
          ...state.user,
          inventory: updatedInventory,
          backpack: state.user.backpack.filter(item => item.id !== item_id)
        }
      };
    }

    case 'UPDATE_COINS':
      return {
        ...state,
        user: {
          ...state.user,
          coins: state.user.coins + action.payload
        }
      };

    default: {
      return state;
    }
  }
}

export function use_game() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('use_game must be used within a GameProvider');
  }
  return context;
}

const defaultAchievement: Achievement = {
  id: '',
  title: '',
  description: '',
  category: 'general',
  icon: Trophy,
  progress: 0,
  total: 100,
  completed: false,
  claimed: false,
  rarity: 'common',
  points: 0,
  unlocked: false,
  max_progress: 100,
  trigger_conditions: [],
  order_num: 0,
  prerequisites: [],
  dependents: [],
  order: 0
};