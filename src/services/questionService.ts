import { Question } from '../types/battle';
import { supabase } from '../lib/supabase';

/**
 * Service for managing battle questions
 */
export class QuestionService {
  /**
   * Fetches questions from the database
   * 
   * @param count - Number of questions to fetch
   * @param category - Optional category filter
   * @param difficulty - Optional difficulty filter
   */
  static async fetchQuestions(
    count: number,
    category?: string,
    difficulty?: number
  ): Promise<Question[]> {
    try {
      let query = supabase
        .from('questions')
        .select('*')
        .eq('is_active', true);

      if (category) {
        query = query.eq('category', category);
      }

      if (difficulty) {
        query = query.eq('difficulty', difficulty);
      }

      const { data, error } = await query.limit(count);

      if (error) throw error;

      return data.map(this.formatQuestion);
    } catch (error) {
      console.error('Error fetching questions:', error);
      return [];
    }
  }

  /**
   * Validates an answer for a question
   * 
   * @param questionId - Question ID
   * @param answer - User's answer
   */
  static async validateAnswer(questionId: string, answer: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('correct_answer')
        .eq('id', questionId)
        .single();

      if (error) throw error;

      return data.correct_answer === answer;
    } catch (error) {
      console.error('Error validating answer:', error);
      return false;
    }
  }

  /**
   * Formats a question from the database
   */
  private static formatQuestion(dbQuestion: any): Question {
    return {
      id: dbQuestion.id,
      question: dbQuestion.question,
      answers: dbQuestion.answers,
      correctAnswer: dbQuestion.correct_answer,
      category: dbQuestion.category,
      difficulty: dbQuestion.difficulty,
      metadata: {
        explanation: dbQuestion.explanation,
        source: dbQuestion.source,
        tags: dbQuestion.tags
      }
    };
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
 * 
 * Used by:
 * - BattleService
 * - Admin question management
 * 
 * Scalability:
 * - Database-ready
 * - Caching support (future)
 * - Category/difficulty filtering
 */ 