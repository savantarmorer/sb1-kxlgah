import { GameState } from '../types/game';
import { BattleResults, BattleState } from '../types/battle';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { calculate_xp_reward, calculate_coin_reward } from './gameUtils';

/**
 * Calculates the results of a battle based on the current state and answer
 */
export const calculate_battle_results = async (
  state: GameState & { battle_stats: GameState['battle_stats'] },
  selected_answer: string
): Promise<BattleResults> => {
  if (!state.battle || state.battle.status !== 'active') {
    throw new Error('Cannot calculate results: Battle not active');
  }

  const current_question = state.battle.questions[state.battle.current_question];
  const is_correct = selected_answer === current_question.correct_answer;
  const next_question_index = state.battle.current_question + 1;
  const total_questions = BATTLE_CONFIG.questions_per_battle;
  const final_score = state.battle.score.player + (is_correct ? 1 : 0);
  const is_victory = final_score > state.battle.score.opponent;

  // Calculate rewards based on performance
  const xp_earned = calculate_xp_reward(
    BATTLE_CONFIG.progress.base_xp * (final_score / total_questions),
    state.battle_stats.difficulty || 1,
    state.user.streak || 0
  );

  const coins_earned = calculate_coin_reward(
    BATTLE_CONFIG.progress.base_coins * (final_score / total_questions),
    state.user.level,
    state.user.streak || 0
  );

  return {
    user_id: state.user.id,
    opponent_id: state.battle.opponent?.id || 'unknown',
    winner_id: is_victory ? state.user.id : (state.battle.opponent?.id || 'unknown'),
    score_player: final_score,
    score_opponent: state.battle.score.opponent,
    isVictory: is_victory,
    is_bot_opponent: state.battle.metadata?.is_bot ?? true,
    current_question: state.battle.current_question,
    total_questions: state.battle.questions.length,
    time_left: state.battle.time_left,
    score: {
      player: final_score,
      opponent: state.battle.score.opponent
    },
    coins_earned,
    streak_bonus: state.user.streak || 0,
    difficulty: state.battle_stats.difficulty || 1,
    player_score: final_score,
    opponent_score: state.battle.score.opponent,
    is_victory: is_victory,
    xp_earned,
    xp_gained: xp_earned,
    victory: is_victory,
    questions_answered: total_questions,
    correct_answers: final_score,
    time_spent: BATTLE_CONFIG.time_per_question - state.battle.time_left
  };
};
