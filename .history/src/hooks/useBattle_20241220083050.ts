import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useGame } from '../contexts/GameContext';
import { BATTLE_CONFIG } from '../config/battleConfig';
import type { BattleQuestion } from '../types/battle';

interface BattleState {
  status: 'idle' | 'in_progress' | 'completed';
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

export function useBattle(matchId?: string) {
  const { state: gameState } = useGame();
  const [battleState, setBattleState] = useState<BattleState>({
    status: 'idle',
    currentQuestion: 0,
    questions: [],
    timeLeft: BATTLE_CONFIG.time_per_question,
    scores: { player: 0, opponent: 0 }
  });
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<any>(null);

  // Initialize battle state
  useEffect(() => {
    if (!matchId || !gameState.user) return;

    const initializeBattle = async () => {
      try {
        // Get battle state from database
        const { data: battle, error: battleError } = await supabase
          .from('battle_matches')
          .select('*')
          .eq('match_id', matchId)
          .single();

        if (battleError) throw battleError;

        // Join battle channel
        const battleChannel = supabase.channel(`battle:${matchId}`);
        
        // Set up channel listeners
        battleChannel
          .on('broadcast', { event: 'player_answer' }, ({ payload }) => {
            if (payload.playerId !== gameState.user?.id) {
              setBattleState(prev => ({
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
            setBattleState(prev => ({
              ...prev,
              lastAnswers: {
                player: playerStates[gameState.user?.id].answer,
                opponent: playerStates[battle.opponent_id].answer,
                correct: currentQuestion.correct_answer
              },
              scores: {
                player: playerStates[gameState.user?.id].score,
                opponent: playerStates[battle.opponent_id].score
              }
            }));
          })
          .on('broadcast', { event: 'next_question' }, ({ payload }) => {
            setBattleState(prev => ({
              ...prev,
              currentQuestion: payload.questionIndex,
              timeLeft: BATTLE_CONFIG.time_per_question,
              lastAnswers: undefined
            }));
          })
          .on('broadcast', { event: 'battle_complete' }, ({ payload }) => {
            setBattleState(prev => ({
              ...prev,
              status: 'completed',
              winner: payload.winner,
              scores: {
                player: payload.finalScores[gameState.user?.id].score,
                opponent: payload.finalScores[battle.opponent_id].score
              }
            }));
          });

        await battleChannel.subscribe();
        setChannel(battleChannel);

        // Initialize state from metadata
        const metadata = battle.metadata;
        setBattleState({
          status: battle.status,
          currentQuestion: metadata.current_question,
          questions: metadata.questions,
          timeLeft: BATTLE_CONFIG.time_per_question,
          scores: {
            player: metadata.player_states[gameState.user.id]?.score || 0,
            opponent: metadata.player_states[battle.opponent_id]?.score || 0
          }
        });

      } catch (error) {
        console.error('Error initializing battle:', error);
        setError('Failed to initialize battle');
      }
    };

    initializeBattle();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [matchId, gameState.user]);

  // Handle timer
  useEffect(() => {
    if (battleState.status !== 'in_progress' || !battleState.lastAnswers) return;

    const timer = setInterval(() => {
      setBattleState(prev => ({
        ...prev,
        timeLeft: Math.max(0, prev.timeLeft - 1)
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [battleState.status, battleState.lastAnswers]);

  // Submit answer
  const submitAnswer = useCallback(async (answer: string) => {
    if (!channel || !gameState.user || !matchId) return;

    try {
      await channel.send({
        type: 'broadcast',
        event: 'player_answer',
        payload: {
          matchId,
          playerId: gameState.user.id,
          answer,
          timeLeft: battleState.timeLeft
        }
      });

      setBattleState(prev => ({
        ...prev,
        lastAnswers: {
          ...prev.lastAnswers,
          player: answer
        }
      }));

    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Failed to submit answer');
    }
  }, [channel, gameState.user, matchId, battleState.timeLeft]);

  return {
    battleState,
    error,
    submitAnswer,
    currentQuestion: battleState.questions[battleState.currentQuestion],
    isWaiting: !!battleState.lastAnswers?.player && !battleState.lastAnswers?.opponent,
    showResults: !!battleState.lastAnswers?.player && !!battleState.lastAnswers?.opponent
  };
}