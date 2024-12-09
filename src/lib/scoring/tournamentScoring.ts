import { supabase } from '@/lib/supabase';
import { TournamentError } from '@/lib/errors';

/**
 * Verifies if the provided answer is correct for the current question in a match
 */
export async function verifyAnswer(match_id: string, answer: string): Promise<boolean> {
  const { data: question, error } = await supabase
    .rpc('get_current_match_question', { match_id });

  if (error) {
    throw new TournamentError('Failed to verify answer');
  }

  return question.correct_answer === answer;
}

/**
 * Calculates the score for a correct answer based on remaining time
 * Score formula: base_points + (time_bonus * remaining_time)
 */
export function calculateScore(remaining_time: number): number {
  const BASE_POINTS = 100;
  const TIME_BONUS = 2;
  return BASE_POINTS + (TIME_BONUS * remaining_time);
}

/**
 * Calculates tournament rewards based on player performance
 */
export function calculateTournamentRewards(params: {
  position: number;
  totalParticipants: number;
  tournamentTier: number;
  playerPerformance: number;
}): {
  xp: number;
  coins: number;
  special_items?: { id: string; amount: number }[];
} {
  const { position, totalParticipants, tournamentTier, playerPerformance } = params;

  // Base rewards for tournament tier
  const BASE_XP = 1000 * tournamentTier;
  const BASE_COINS = 500 * tournamentTier;

  // Position multiplier (1st = 1.0, last = 0.1)
  const positionMultiplier = 1 - ((position - 1) / totalParticipants * 0.9);

  // Performance multiplier (0.5 to 1.5 based on average score)
  const performanceMultiplier = 0.5 + (playerPerformance * 1.0);

  // Calculate final rewards
  const xp = Math.round(BASE_XP * positionMultiplier * performanceMultiplier);
  const coins = Math.round(BASE_COINS * positionMultiplier * performanceMultiplier);

  // Special items for top performers
  const special_items = position <= 3 ? [
    { id: 'trophy_tier_' + tournamentTier, amount: 1 },
    { id: 'medal_' + position, amount: 1 }
  ] : undefined;

  return {
    xp,
    coins,
    special_items
  };
} 