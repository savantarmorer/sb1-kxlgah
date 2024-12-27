import { supabase } from '@/lib/supabase';
import { Question } from '@/types/tournament';
import { TournamentError } from '@/errors/TournamentError';
import { QUESTIONS_PER_MATCH } from '@/types/tournament';
import { cache } from '@/lib/cache/redisCache';

interface TournamentRules {
  subject_areas?: string[];
  difficulty?: number;
}

interface Tournament {
  rules: TournamentRules;
}

interface TournamentMatchResponse {
  tournament: {
    rules: TournamentRules;
  };
}

export class QuestionService {
  /**
   * Get questions for a match
   */
  static async getQuestionsForMatch(match_id: string): Promise<Question[]> {
    try {
      // Try cache first
      const cachedQuestions = await cache.get<Question[]>(`match_questions:${match_id}`);
      if (cachedQuestions) return cachedQuestions;

      // Get match details and tournament rules
      const { data: matchData } = await supabase
        .from('tournament_matches')
        .select(`
          tournament:tournaments!inner(
            rules
          )
        `)
        .eq('id', match_id)
        .single();

      if (!matchData) {
        throw new TournamentError('Match not found');
      }

      const match = matchData as unknown as TournamentMatchResponse;
      const subjectAreas = match.tournament.rules?.subject_areas || [];
      const difficulty = match.tournament.rules?.difficulty || 1;

      // Get questions based on rules
      const { data: questions } = await supabase
        .from('battle_questions')
        .select('*')
        .in('category', subjectAreas)
        .eq('difficulty', difficulty)
        .order('RANDOM()')
        .limit(QUESTIONS_PER_MATCH);

      if (!questions?.length) {
        throw new TournamentError('No questions available for match');
      }

      // Cache questions
      await cache.set(
        `match_questions:${match_id}`,
        questions,
        60 * 30 // 30 minutes
      );

      return questions;
    } catch (error) {
      console.error('Error getting match questions:', error);
      throw new TournamentError('Failed to get match questions');
    }
  }

  /**
   * Validate a player's answer
   */
  static async validateAnswer(
    match_id: string,
    question_id: string,
    player_id: string,
    answer: string
  ): Promise<{
    correct: boolean;
    score: number;
    timeBonus: number;
  }> {
    try {
      // Get question details
      const { data: question } = await supabase
        .from('battle_questions')
        .select('*')
        .eq('id', question_id)
        .single();

      if (!question) {
        throw new TournamentError('Question not found');
      }

      // Get match state
      const { data: matchQuestion } = await supabase
        .from('match_questions')
        .select('*')
        .eq('match_id', match_id)
        .eq('question_id', question_id)
        .single();

      if (!matchQuestion) {
        throw new TournamentError('Match question not found');
      }

      const correct = question.correct_answer === answer;
      const timeBonus = this.calculateTimeBonus(matchQuestion.start_time);
      const score = this.calculateScore(correct, timeBonus, question.difficulty);

      // Record answer
      await this.recordAnswer(match_id, question_id, player_id, answer, score);

      return { correct, score, timeBonus };
    } catch (error) {
      console.error('Error validating answer:', error);
      throw new TournamentError('Failed to validate answer');
    }
  }

  /**
   * Record a player's answer
   */
  private static async recordAnswer(
    match_id: string,
    question_id: string,
    player_id: string,
    answer: string,
    score: number
  ): Promise<void> {
    const { data: match } = await supabase
      .from('tournament_matches')
      .select('player1_id, player2_id')
      .eq('id', match_id)
      .single();

    if (!match) return;

    const isPlayer1 = match.player1_id === player_id;
    const updateField = isPlayer1 ? 'player1_answer' : 'player2_answer';
    const scoreField = isPlayer1 ? 'player1_score' : 'player2_score';

    await supabase
      .from('match_questions')
      .update({
        [updateField]: answer,
        [scoreField]: score,
        answered_at: new Date().toISOString()
      })
      .eq('match_id', match_id)
      .eq('question_id', question_id);
  }

  /**
   * Calculate time bonus based on answer speed
   */
  private static calculateTimeBonus(startTime: string): number {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const timeElapsed = (now - start) / 1000; // seconds
    const maxTimeBonus = 50;
    const minTime = 1;
    const maxTime = 10;

    if (timeElapsed <= minTime) return maxTimeBonus;
    if (timeElapsed >= maxTime) return 0;

    return Math.round(
      maxTimeBonus * (1 - (timeElapsed - minTime) / (maxTime - minTime))
    );
  }

  /**
   * Calculate question score
   */
  private static calculateScore(
    correct: boolean,
    timeBonus: number,
    difficulty: number
  ): number {
    if (!correct) return 0;

    const baseScore = 100;
    const difficultyMultiplier = difficulty * 0.5;
    
    return Math.round(
      (baseScore + timeBonus) * (1 + difficultyMultiplier)
    );
  }
}

/**
 * Service Role:
 * - Question retrieval and validation
 * - Database interaction
 * - Question formatting
 * 
 * Dependencies:
 * - Supabase client
 * - Question types
 * - Database schema
 * 
 * Used by:
 * - BattleService
 * - Admin question management
 * - Battle system
 * 
 * Features:
 * - Random question selection
 * - Category filtering
 * - Difficulty filtering
 * - Answer validation
 * 
 * Scalability:
 * - Separate DB interface
 * - Type-safe operations
 * - Easy to extend
 * - Caching support (future)
 * 
 * Error Handling:
 * - Database errors
 * - Type validation
 * - Fallback responses
 */ 

