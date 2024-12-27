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
  isCorrect: boolean,
  timeLeft: number,
  streak: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): BattleRewards {
  // Convert difficulty to numeric multiplier
  const difficultyMultiplier = {
    'easy': 1,
    'medium': 1.2,
    'hard': 1.4
  }[difficulty] || 1.2;

  // Use LevelSystem's complete battle rewards calculation
  const rewards = LevelSystem.calculate_complete_battle_rewards(
    isCorrect ? 1 : 0, // score (1 for correct answer)
    1, // totalQuestions (1 for single question)
    difficultyMultiplier,
    streak,
    timeLeft
  );

  // Format the rewards to match the expected interface
  return {
    total_xp: rewards.xp_earned,
    total_coins: rewards.coins_earned,
    xp_earned: rewards.xp_earned - rewards.streak_bonus - rewards.time_bonus,
    coins_earned: rewards.coins_earned,
    time_bonus: rewards.time_bonus,
    streak_bonus: rewards.streak_bonus,
    metadata: {
      base_reward: rewards.xp_earned - rewards.streak_bonus - rewards.time_bonus,
      time_bonus: rewards.time_bonus,
      streak_bonus: rewards.streak_bonus,
      difficulty_bonus: Math.floor((difficultyMultiplier - 1) * 100),
      correct_answers: isCorrect ? 1 : 0,
      total_questions: 1,
      average_time: 30 - timeLeft,
      max_streak: streak,
      damage_dealt: isCorrect ? 10 : 0,
      damage_taken: isCorrect ? 0 : 5,
      shield_gained: isCorrect ? 2 : 0
    }
  };
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
    isCorrect,
    30, // Default time left since it's not in the BattleState
    state.user?.streak || 0,
    (state.battle_stats as any)?.difficulty || 'medium'
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

