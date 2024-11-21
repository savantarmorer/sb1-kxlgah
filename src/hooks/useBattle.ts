import { useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import { BattleService } from '../services/battleService';
import { Achievement } from '../types/achievements';
import { BattleResults } from '../types/battle';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { User } from '../types/user';

export function useBattle() {
  const { state, dispatch } = useGame();
  
  const userWithRating = {
    ...state.user,
    battleRating: state.user.battleRating ?? BATTLE_CONFIG.matchmaking.defaultRating
  } satisfies User;

  const handleBattleEnd = useCallback(async (finalScore: { player: number; opponent: number }, timeBonus: number) => {
    try {
      const results = BattleService.calculateResults(
        finalScore.player,
        state.battle.questions.length,
        userWithRating.streak,
        timeBonus
      );

      // Update battle stats
      if (state.battleStats) {
        await BattleService.updateStats(userWithRating.id, results, state.battleStats);
      }

      // Update rating if opponent exists
      if (state.battle.currentOpponent) {
        const opponentRating = state.battle.opponentRating ?? BATTLE_CONFIG.matchmaking.defaultRating;
        
        const ratingChange = BattleService.calculateRatingChange(
          userWithRating.battleRating,
          opponentRating,
          results.isVictory
        );
        
        dispatch({
          type: 'UPDATE_USER_PROFILE',
          payload: {
            battleRating: userWithRating.battleRating + ratingChange
          }
        });
      }

      // Check for perfect score achievement
      if (finalScore.player === state.battle.questions.length * BATTLE_CONFIG.pointsPerQuestion) {
        const achievement: Achievement = {
          id: 'perfect_battle',
          title: 'Perfect Scholar',
          description: 'Answer all questions correctly in a battle',
          category: 'battles',
          points: 100,
          rarity: 'legendary',
          unlocked: true,
          unlockedAt: new Date(),
          prerequisites: [],
          dependents: [],
          triggerConditions: [{
            type: 'battle_score',
            value: 100,
            comparison: 'eq'
          }],
          order: 100
        };
        
        dispatch({
          type: 'UNLOCK_ACHIEVEMENT',
          payload: achievement
        });
      }

      dispatch({ type: 'END_BATTLE', payload: results });
      
    } catch (error) {
      console.error('Battle end processing failed:', error);
      dispatch({ 
        type: 'END_BATTLE', 
        payload: {
          isVictory: false,
          experienceGained: 0,
          coinsEarned: 0,
          streakBonus: 0,
          timeBonus: 0,
          totalScore: finalScore.player,
          scorePercentage: (finalScore.player / (state.battle.questions.length * BATTLE_CONFIG.pointsPerQuestion)) * 100
        }
      });
    }
  }, [state.battle, userWithRating, dispatch]);

  const handleAnswer = useCallback(async (answerIndex: number) => {
    try {
      if (!state.battle.questions[state.battle.currentQuestion]) {
        throw new Error('No current question available');
      }

      if (state.battle.status !== 'battle') {
        return;
      }

      const currentQuestion = state.battle.questions[state.battle.currentQuestion];
      const isCorrect = answerIndex === currentQuestion.correctAnswer;
      const timeBonus = Math.max(0, state.battle.timeLeft / BATTLE_CONFIG.timePerQuestion);

      const basePoints = isCorrect ? BATTLE_CONFIG.pointsPerQuestion : 0;
      const timeBonusPoints = Math.floor(timeBonus * BATTLE_CONFIG.rewards.timeBonus.multiplier);
      const totalPoints = basePoints + timeBonusPoints;

      const newScore = {
        player: state.battle.score.player + totalPoints,
        opponent: state.battle.score.opponent + 
          Math.floor(Math.random() * BATTLE_CONFIG.pointsPerQuestion)
      };

      await dispatch({
        type: 'UPDATE_BATTLE_PROGRESS',
        payload: {
          questionId: currentQuestion.id,
          correct: isCorrect,
          playerAnswers: [...state.battle.playerAnswers, isCorrect],
          score: newScore,
        }
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      if (state.battle.currentQuestion >= state.battle.questions.length - 1) {
        await handleBattleEnd(newScore, timeBonus);
      } else {
        dispatch({
          type: 'ADVANCE_QUESTION',
          payload: state.battle.currentQuestion + 1
        });
      }

    } catch (error) {
      console.error('Answer handling failed:', error);
      // Don't throw - allow battle to continue even if there's an error
    }
  }, [state.battle, dispatch, handleBattleEnd]);

  const initializeBattle = useCallback(async (category?: string, difficulty?: number) => {
    try {
      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'searching' });
      
      const questions = await BattleService.getQuestions(
        BATTLE_CONFIG.questionsPerBattle,
        category,
        difficulty
      );

      if (!questions || questions.length === 0) {
        throw new Error('No questions available');
      }

      dispatch({
        type: 'INITIALIZE_BATTLE',
        payload: {
          questions,
          timePerQuestion: BATTLE_CONFIG.timePerQuestion
        }
      });

      await new Promise(resolve => setTimeout(resolve, BATTLE_CONFIG.searchTime * 1000));
      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'ready' });
      await new Promise(resolve => setTimeout(resolve, BATTLE_CONFIG.readyTime * 1000));
      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'battle' });

    } catch (error) {
      console.error('Battle initialization failed:', error);
      dispatch({ 
        type: 'SET_BATTLE_STATUS', 
        payload: 'completed' 
      });
      throw error;
    }
  }, [dispatch]);

  return {
    battleState: state.battle,
    handleAnswer,
    initializeBattle
  };
}