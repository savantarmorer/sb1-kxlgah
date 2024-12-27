import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { BattleService } from '../services/battleService';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { supabase } from '../lib/supabase';
import { 
  BattleQuestion, 
  BattleResults, 
  BattleStatus,
  battle_statsDB,
  BattleState,
  BattleRewards
} from '../types/battle';
import { NotificationType } from '../types/notifications';
import { RewardService } from '../services/rewardService';
import { useAchievements } from './useAchievements';
import { useBattleSound } from './useBattleSound';
import { useNotification } from '../contexts/NotificationContext';
import { useTranslation } from '../contexts/LanguageContext';
import { calculateBattleRewards, calculateBattleResults } from '../utils/battleUtils';
import { calculate_level_xp } from '../utils/gameUtils';
import type { Reward } from '../types/rewards';
import { LevelSystem } from '../lib/levelSystem';

interface BattleOptions {
  opponent_id?: string;
  is_bot?: boolean;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface MultiplayerBattleState {
  currentQuestion: number;
  questions: BattleQuestion[];
  timeLeft: number;
  scores: {
    player: number;
    opponent: number;
  };
  lastAnswers?: {
    player?: string;
    opponent?: string;
    correct?: string;
  };
  winner?: string | null;
}

export function useBattle() {
  const { state, dispatch } = useGame();
  const { user: authUser, isLoading: isAuthLoading, initialized: authInitialized } = useAuth();
  const { check_achievements } = useAchievements();
  const { play_sound } = useBattleSound();
  const { showSuccess, showError, showInfo } = useNotification();
  const { t } = useTranslation();
  const user = state.user;

  // Track if battle system is ready
  const [isReady, setIsReady] = useState(false);
  const [channel, setChannel] = useState<any>(null);
  const [multiplayerState, setMultiplayerState] = useState<MultiplayerBattleState | null>(null);

  // Ensure we have an authenticated user and game state is synced
  useEffect(() => {
    // ... existing auth and sync code ...
  }, [authUser, user, isAuthLoading, authInitialized, showError, t, state.battle_stats, dispatch]);

  // Handle multiplayer battle initialization
  useEffect(() => {
    if (!state.battle?.matchId || !user?.id) return;

    const initializeMultiplayerBattle = async () => {
      try {
        // Get battle state from database
        const { data: battle, error: battleError } = await supabase
          .from('battle_matches')
          .select('*')
          .eq('match_id', state.battle.matchId)
          .single();

        if (battleError) throw battleError;

        // Join battle channel
        const battleChannel = supabase.channel(`battle:${state.battle.matchId}`);
        
        // Set up channel listeners
        battleChannel
          .on('broadcast', { event: 'player_answer' }, ({ payload }) => {
            if (payload.playerId !== user.id) {
              setMultiplayerState(prev => prev && ({
                ...prev,
                lastAnswers: {
                  ...prev.lastAnswers,
                  opponent: payload.answer
                }
              }));
            }
          })
          .on('broadcast', { event: 'question_results' }, ({ payload }) => {
            const { currentQuestion, playerStates } = payload;
            setMultiplayerState(prev => prev && ({
              ...prev,
              lastAnswers: {
                player: playerStates[user.id]?.answer,
                opponent: playerStates[battle.opponent_id]?.answer,
                correct: currentQuestion.correct_answer
              },
              scores: {
                player: playerStates[user.id]?.score || 0,
                opponent: playerStates[battle.opponent_id]?.score || 0
              }
            }));
          })
          .on('broadcast', { event: 'next_question' }, ({ payload }) => {
            setMultiplayerState(prev => prev && ({
              ...prev,
              currentQuestion: payload.questionIndex,
              timeLeft: BATTLE_CONFIG.time_per_question,
              lastAnswers: undefined
            }));
          })
          .on('broadcast', { event: 'battle_complete' }, ({ payload }) => {
            const { winner, finalScores } = payload;
            setMultiplayerState(prev => prev && ({
              ...prev,
              winner,
              scores: {
                player: finalScores[user.id]?.score || 0,
                opponent: finalScores[battle.opponent_id]?.score || 0
              }
            }));

            // Handle battle completion with existing logic
            const results: BattleResults = {
              victory: winner === user.id,
              score: finalScores[user.id]?.score || 0,
              opponent_score: finalScores[battle.opponent_id]?.score || 0,
              stats: {
                total_questions: state.battle?.questions?.length || 0,
                correct_answers: finalScores[user.id]?.correct_count || 0,
                time_bonus: finalScores[user.id]?.time_bonus || 0
              }
            };

            handle_battle_completion(results);
          });

        await battleChannel.subscribe();
        setChannel(battleChannel);

        // Initialize multiplayer state from metadata
        const metadata = battle.metadata;
        setMultiplayerState({
          currentQuestion: metadata.current_question,
          questions: metadata.questions,
          timeLeft: BATTLE_CONFIG.time_per_question,
          scores: {
            player: metadata.player_states[user.id]?.score || 0,
            opponent: metadata.player_states[battle.opponent_id]?.score || 0
          }
        });

      } catch (error) {
        console.error('Error initializing multiplayer battle:', error);
        showError(t('battle.error.multiplayer_init'));
      }
    };

    initializeMultiplayerBattle();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [state.battle?.matchId, user?.id]);

  // ... existing reward and calculation functions ...

  const answer_question = useCallback(async (selected_answer: string) => {
    if (!state.user?.id) {
      throw new Error('No authenticated user found');
    }

    try {
      if (state.battle?.matchId && channel) {
        // Handle multiplayer answer
        await channel.send({
          type: 'broadcast',
          event: 'player_answer',
          payload: {
            matchId: state.battle.matchId,
            playerId: state.user.id,
            answer: selected_answer,
            timeLeft: state.battle.time_left
          }
        });

        setMultiplayerState(prev => prev && ({
          ...prev,
          lastAnswers: {
            ...prev.lastAnswers,
            player: selected_answer
          }
        }));
      } else {
        // Handle single player answer with existing logic
        // ... existing answer logic ...
      }

      return results;
    } catch (error) {
      console.error('Error answering question:', error);
      showError(t('battle.error.answer_failed'));
      throw error;
    }
  }, [state, dispatch, handle_battle_completion, showError, t, channel]);

  return {
    // ... existing return values ...
    multiplayerState,
    isMultiplayer: !!state.battle?.matchId,
    isWaiting: multiplayerState?.lastAnswers?.player && !multiplayerState?.lastAnswers?.opponent,
    showResults: multiplayerState?.lastAnswers?.player && multiplayerState?.lastAnswers?.opponent
  };
}