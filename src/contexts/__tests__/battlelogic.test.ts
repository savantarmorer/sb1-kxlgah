import { handleBattleStateUpdate } from '../game/battle';
import { BATTLE_CONFIG } from '../../config/battleConfig';
import { BattleState, BattleStatus } from '../../types/battle';

describe('Battle State Management', () => {
  let initialState: BattleState;

  beforeEach(() => {
    initialState = {
      status: 'idle' as BattleStatus,
      current_question: 0,
      total_questions: 0,
      questions: [],
      score: { player: 0, opponent: 0 },
      player_answers: [],
      time_left: BATTLE_CONFIG.time_per_question,
      opponent: null,
      rewards: {
        xp_earned: 0,
        coins_earned: 0,
        streak_bonus: 0,
        time_bonus: 0
      },
      time_per_question: BATTLE_CONFIG.time_per_question,
      in_progress: false,
      metadata: {
        is_bot: true,
        difficulty: 'easy',
        mode: 'practice'
      },
      error: {
        message: '',
        timestamp: 0
      }
    };
  });

  describe('Battle Initialization', () => {
    it('should initialize battle with valid questions', () => {
      const questions = [
        { 
          id: '1',
          question: 'Test Question 1',
          correct_answer: 'A',
          alternative_a: 'A',
          alternative_b: 'B',
          alternative_c: 'C',
          alternative_d: 'D'
        },
        { 
          id: '2',
          question: 'Test Question 2',
          correct_answer: 'B',
          alternative_a: 'A',
          alternative_b: 'B',
          alternative_c: 'C',
          alternative_d: 'D'
        }
      ];

      const action = {
        type: 'INITIALIZE_BATTLE' as const,
        payload: {
          questions,
          opponent: {
            id: '1',
            name: 'Test Opponent',
            rating: 1000,
            is_bot: true,
            level: 1
          }
        }
      };

      const newState = handleBattleStateUpdate(initialState, action);

      expect(newState.status).toBe('preparing');
      expect(newState.questions).toEqual(questions);
      expect(newState.total_questions).toBe(2);
      expect(newState.current_question).toBe(0);
      expect(newState.score).toEqual({ player: 0, opponent: 0 });
      expect(newState.time_left).toBe(BATTLE_CONFIG.time_per_question);
    });

    it('should handle initialization with no questions', () => {
      const action = {
        type: 'INITIALIZE_BATTLE' as const,
        payload: {
          questions: [],
          opponent: {
            id: '1',
            name: 'Test Opponent',
            rating: 1000,
            is_bot: true,
            level: 1
          }
        }
      };

      const newState = handleBattleStateUpdate(initialState, action);
      expect(newState.status).toBe('error');
    });
  });

  describe('Battle Status Management', () => {
    it('should update battle status correctly', () => {
      const stateWithQuestions = {
        ...initialState,
        questions: [
          { 
            id: '1',
            question: 'Test Question',
            correct_answer: 'A',
            alternative_a: 'A',
            alternative_b: 'B',
            alternative_c: 'C',
            alternative_d: 'D'
          }
        ],
        total_questions: 1
      };

      const action = {
        type: 'SET_BATTLE_STATUS' as const,
        payload: 'active' as BattleStatus
      };

      const newState = handleBattleStateUpdate(stateWithQuestions, action);
      expect(newState.status).toBe('active');
    });

    it('should prevent transition to active without questions', () => {
      const action = {
        type: 'SET_BATTLE_STATUS' as const,
        payload: 'active' as BattleStatus
      };

      const newState = handleBattleStateUpdate(initialState, action);
      expect(newState.status).toBe('error');
    });
  });

  describe('Answer Question Handling', () => {
    it('should handle correct answer submission', () => {
      const stateWithQuestions = {
        ...initialState,
        status: 'active' as BattleStatus,
        questions: [
          { 
            id: '1',
            question: 'Q1',
            correct_answer: 'A',
            alternative_a: 'A',
            alternative_b: 'B',
            alternative_c: 'C',
            alternative_d: 'D'
          },
          { 
            id: '2',
            question: 'Q2',
            correct_answer: 'B',
            alternative_a: 'A',
            alternative_b: 'B',
            alternative_c: 'C',
            alternative_d: 'D'
          }
        ],
        total_questions: 2
      };

      const action = {
        type: 'ANSWER_QUESTION' as const,
        payload: { 
          answer: 'A',
          is_correct: true 
        }
      };

      const newState = handleBattleStateUpdate(stateWithQuestions, action);

      expect(newState.score.player).toBe(1);
      expect(newState.current_question).toBe(1);
      expect(newState.player_answers).toEqual([true]);
    });

    it('should handle last question completion', () => {
      const stateWithLastQuestion = {
        ...initialState,
        status: 'active' as BattleStatus,
        questions: [
          { 
            id: '1',
            question: 'Last Q',
            correct_answer: 'A',
            alternative_a: 'A',
            alternative_b: 'B',
            alternative_c: 'C',
            alternative_d: 'D'
          }
        ],
        total_questions: 1,
        current_question: 0
      };

      const action = {
        type: 'ANSWER_QUESTION' as const,
        payload: { 
          answer: 'A',
          is_correct: true 
        }
      };

      const newState = handleBattleStateUpdate(stateWithLastQuestion, action);
      expect(newState.status).toBe('completed');
      expect(newState.score.player).toBe(1);
    });
  });

  describe('Battle End Handling', () => {
    it('should handle victory condition', () => {
      const stateBeforeEnd = {
        ...initialState,
        score: { player: 3, opponent: 1 }
      };

      const action = {
        type: 'END_BATTLE' as const,
        payload: {
          rewards: {
            xp_earned: 100,
            coins_earned: 50,
            streak_bonus: 0,
            time_bonus: 0
          }
        }
      };

      const newState = handleBattleStateUpdate(stateBeforeEnd, action);
      expect(newState.status).toBe('victory');
      expect(newState.rewards).toEqual({
        xp_earned: 100,
        coins_earned: 50,
        streak_bonus: 0,
        time_bonus: 0
      });
    });

    it('should handle defeat condition', () => {
      const stateBeforeEnd = {
        ...initialState,
        score: { player: 1, opponent: 3 }
      };

      const action = {
        type: 'END_BATTLE' as const,
        payload: {
          rewards: {
            xp_earned: 10,
            coins_earned: 5,
            streak_bonus: 0,
            time_bonus: 0
          }
        }
      };

      const newState = handleBattleStateUpdate(stateBeforeEnd, action);
      expect(newState.status).toBe('defeat');
      expect(newState.rewards).toEqual({
        xp_earned: 10,
        coins_earned: 5,
        streak_bonus: 0,
        time_bonus: 0
      });
    });
  });
});
