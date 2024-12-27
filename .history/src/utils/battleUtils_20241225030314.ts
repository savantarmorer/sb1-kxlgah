import { LevelSystem } from '../lib/levelSystem';
import { BATTLE_CONFIG } from '../config/battleConfig';
import type { BattleResults, BattleRewards, BattleScore, BattleState, BattleQuestion } from '../types/battle';
import type { GameState } from '../types/game';
import { supabase } from '../lib/supabase';

/**
 * Simulates opponent answer with 60% chance of being correct
 */
export const simulateOpponentAnswer = (): boolean => {
  return Math.random() > 0.4;
};

/**
 * Calculates battle score based on correct answers
 */
export const calculateBattleScore = (
  currentScore: BattleScore,
  isPlayerCorrect: boolean,
  simulateOpponent: boolean = true
): BattleScore => {
  return {
    player: currentScore.player + (isPlayerCorrect ? 1 : 0),
    opponent: currentScore.opponent + (simulateOpponent ? (simulateOpponentAnswer() ? 1 : 0) : 0)
  };
};

/**
 * Determines battle victory status
 */
export const determineBattleStatus = (score: BattleScore): {
  isVictory: boolean;
  isDraw: boolean;
} => {
  return {
    isVictory: score.player > score.opponent,
    isDraw: score.player === score.opponent
  };
};

/**
 * Calculates complete battle rewards including XP, coins, streak and time bonuses
 */
export function calculateBattleRewards(
  score: number,
  totalQuestions: number,
  difficulty: number = 1,
  streak: number = 0,
  timeLeft: number = 0
): BattleRewards {
  return LevelSystem.calculate_complete_battle_rewards(
    score,
    totalQuestions,
    difficulty,
    streak,
    timeLeft
  );
}

/**
 * Calculates final battle results including score, rewards and stats
 */
export const calculateBattleResults = (
  state: GameState,
  answer: string
): BattleResults => {
  if (!state.battle) {
    throw new Error('No active battle found');
  }

  const battle = state.battle;
  const currentQuestion = battle.currentQuestion as BattleQuestion;
  
  if (!currentQuestion) {
    throw new Error('Current question not found');
  }

  const isCorrect = answer.toUpperCase() === currentQuestion.correct_answer;
  
  // Debug answer checking
  console.debug('[Battle Debug] Answer Check:', {
    userAnswer: answer.toUpperCase(),
    correctAnswer: currentQuestion.correct_answer,
    isCorrect,
    question: currentQuestion.question
  });

  // Get current score from player states
  const currentScore = {
    player: battle.player1?.health || 0,
    opponent: battle.player2?.health || 0
  };

  const newScore = calculateBattleScore(currentScore, isCorrect);
  const { isVictory, isDraw } = determineBattleStatus(newScore);

  // Calculate total questions from turn number
  const totalQuestions = battle.turn || 0;

  // Calculate rewards using LevelSystem
  const rewards = calculateBattleRewards(
    newScore.player,
    totalQuestions,
    (state.battle_stats as any)?.difficulty || 1,
    state.user?.streak || 0,
    30 // Default time left since it's not in the BattleState
  );

  // Debug battle state
  console.debug('[Battle Debug] Battle Results:', {
    score: newScore,
    isVictory,
    isDraw,
    rewards,
    questionProgress: {
      current: battle.turn || 0,
      total: totalQuestions
    }
  });

  return {
    victory: isVictory,
    draw: isDraw,
    user_id: state.user?.id || '',
    score: newScore,
    rewards,
    stats: {
      time_taken: BATTLE_CONFIG.time_per_question - 30, // Using default time
      total_questions: totalQuestions,
      average_time: BATTLE_CONFIG.time_per_question - 30, // Using default time
      correct_answers: newScore.player
    }
  };
};

