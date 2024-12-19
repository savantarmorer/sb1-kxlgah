import { LevelSystem } from '../lib/levelSystem';
import { BATTLE_CONFIG } from '../config/battleConfig';
import type { BattleResults, BattleRewards, BattleScore } from '../types/battle';
import type { GameState } from '../types/game';
import { supabase } from '../lib/supabaseClient.ts';
import { ProgressService } from '../services/progressService';

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
  const scoreRatio = score / totalQuestions;
  const baseXP = score * BATTLE_CONFIG.rewards.base_xp * difficulty * scoreRatio;
  const baseCoins = score * BATTLE_CONFIG.rewards.base_coins * difficulty * scoreRatio;
  
  const streakBonus = Math.floor(streak * BATTLE_CONFIG.rewards.streak_bonus.multiplier * baseXP);
  const timeBonus = Math.floor(timeLeft * BATTLE_CONFIG.rewards.time_bonus.multiplier);

  return {
    xp_earned: baseXP,
    coins_earned: baseCoins,
    streak_bonus: streakBonus,
    time_bonus: timeBonus
  };
}

/**
 * Role: Calculate battle rewards
 * Dependencies:
 * - BATTLE_CONFIG
 * - BattleRewards type
 * 
 * Used by:
 * - BattleService
 * - Battle state management
 * 
 * Features:
 * - XP calculation
 * - Coin rewards
 * - Streak bonuses
 * - Time bonuses
 * 
 * Database impact:
 * - Results stored in battle_history
 * - Affects user_progress
 */

/**
 * Calculates final battle results including score, rewards and stats
 */
export const calculateBattleResults = async (
  state: GameState,
  answer: string
): Promise<BattleResults> => {
  if (!state.battle) {
    throw new Error('No active battle found');
  }

  const battle = state.battle;
  const currentQuestion = battle.questions[battle.current_question];
  
  if (!currentQuestion) {
    throw new Error('Current question not found');
  }

  const isCorrect = answer.toUpperCase() === currentQuestion.correct_answer;
  
  console.debug('[Battle Debug] Answer Check:', {
    userAnswer: answer.toUpperCase(),
    correctAnswer: currentQuestion.correct_answer,
    isCorrect,
    question: currentQuestion.question
  });

  const newScore = calculateBattleScore(battle.score, isCorrect);
  const { isVictory, isDraw } = determineBattleStatus(newScore);

  // Calculate rewards using LevelSystem
  const rewards = calculateBattleRewards(
    newScore.player,
    battle.questions.length,
    state.battle_stats?.difficulty || 1,
    state.user.streak,
    battle.time_left
  );

  // Check for level up
  const newXP = state.user.xp + rewards.xp_earned;
  const newLevel = LevelSystem.calculate_level(newXP);
  
  console.debug('[Battle Debug] Level Check:', {
    currentXP: state.user.xp,
    earnedXP: rewards.xp_earned,
    newXP,
    currentLevel: state.user.level,
    newLevel
  });

  // Create lootbox if leveled up
  if (newLevel > state.user.level) {
    console.debug('[Battle Debug] Level Up Detected:', {
      from: state.user.level,
      to: newLevel
    });

    const levelUpRewards = LevelSystem.get_level_rewards(newLevel);
    const rarity = newLevel >= 50 ? 'legendary' : newLevel >= 30 ? 'epic' : newLevel >= 10 ? 'rare' : 'common';

    // Create pending lootbox
    try {
      const lootbox = await ProgressService.createPendingLootbox(
        state.user.id,
        'level_up',
        levelUpRewards,
        rarity
      );
      console.debug('[Battle Debug] Lootbox Created:', lootbox);
    } catch (error) {
      console.error('[Battle Debug] Failed to create lootbox:', error);
    }
  }

  console.debug('[Battle Debug] Battle Results:', {
    score: newScore,
    isVictory,
    isDraw,
    rewards,
    questionProgress: {
      current: battle.current_question + 1,
      total: battle.questions.length
    }
  });

  return {
    victory: isVictory,
    draw: isDraw,
    score: newScore,
    rewards,
    stats: {
      correct_answers: battle.player_answers.filter(a => a).length + (isCorrect ? 1 : 0),
      total_questions: battle.questions.length,
      time_taken: BATTLE_CONFIG.time_per_question - battle.time_left,
      average_time: (BATTLE_CONFIG.time_per_question - battle.time_left) / (battle.current_question + 1)
    }
  };
};

