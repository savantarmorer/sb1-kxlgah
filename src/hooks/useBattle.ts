import { useState, useCallback, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { BattleService } from '../services/battleService';
import { Question } from '../types/battle';

interface BattleState {
  status: 'searching' | 'ready' | 'battle' | 'completed';
  currentQuestion: number;
  timeLeft: number;
  score: {
    player: number;
    opponent: number;
  };
  streakBonus: number;
  questions: Question[];
}

export function useBattle() {
  const { state, dispatch } = useGame();
  const [battleState, setBattleState] = useState<BattleState>({
    status: 'searching',
    currentQuestion: 0,
    timeLeft: BATTLE_CONFIG.questionTime,
    score: { player: 0, opponent: 0 },
    streakBonus: 0,
    questions: []
  });

  // Initialize battle
  useEffect(() => {
    const initBattle = async () => {
      if (battleState.status === 'searching') {
        // Simulate searching for opponent
        await new Promise(resolve => setTimeout(resolve, BATTLE_CONFIG.searchTime * 1000));
        
        // Get questions
        const questions = await BattleService.getQuestions(3);
        
        setBattleState(prev => ({
          ...prev,
          status: 'ready',
          questions
        }));

        // Start battle after ready countdown
        setTimeout(() => {
          setBattleState(prev => ({
            ...prev,
            status: 'battle'
          }));
        }, BATTLE_CONFIG.readyTime * 1000);
      }
    };

    initBattle();
  }, []);

  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (battleState.status === 'battle' && battleState.timeLeft > 0) {
      timer = setInterval(() => {
        setBattleState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [battleState.status, battleState.timeLeft]);

  // Auto-progress when time runs out
  useEffect(() => {
    if (battleState.timeLeft === 0) {
      handleAnswer(-1); // -1 indicates timeout
    }
  }, [battleState.timeLeft]);

  const handleAnswer = useCallback((answerIndex: number) => {
    const currentQuestion = battleState.questions[battleState.currentQuestion];
    const isCorrect = answerIndex === currentQuestion?.correctAnswer;
    
    if (isCorrect) {
      const timeBonus = BattleService.calculateTimeBonus(battleState.timeLeft);
      const streakBonus = BattleService.calculateStreakBonus(state.user.streak);
      const totalXP = BATTLE_CONFIG.rewards.baseXP + timeBonus + streakBonus;

      dispatch({
        type: 'ADD_XP',
        payload: {
          amount: totalXP,
          reason: 'Battle Question Correct'
        }
      });

      setBattleState(prev => ({
        ...prev,
        score: {
          ...prev.score,
          player: prev.score.player + 1
        },
        streakBonus: prev.streakBonus + timeBonus + streakBonus
      }));
    }

    // Simulate opponent
    const opponentCorrect = Math.random() > 0.4;
    setBattleState(prev => ({
      ...prev,
      score: {
        ...prev.score,
        opponent: prev.score.opponent + (opponentCorrect ? 1 : 0)
      }
    }));

    // Progress to next question or end battle
    if (battleState.currentQuestion < battleState.questions.length - 1) {
      setBattleState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        timeLeft: BATTLE_CONFIG.questionTime
      }));
    } else {
      setBattleState(prev => ({
        ...prev,
        status: 'completed'
      }));
    }
  }, [battleState, dispatch, state.user.streak]);

  const endBattle = useCallback(() => {
    const isVictory = battleState.score.player > battleState.score.opponent;
    
    if (isVictory) {
      dispatch({ type: 'INCREMENT_STREAK' });
    } else {
      dispatch({ type: 'RESET_STREAK' });
    }

    // Check for achievements
    const battleResults = {
      score: battleState.score.player,
      totalQuestions: battleState.questions.length,
      xpEarned: battleState.score.player * BATTLE_CONFIG.rewards.baseXP + battleState.streakBonus,
      coinsEarned: battleState.score.player * BATTLE_CONFIG.rewards.baseCoins,
      isVictory,
      streakBonus: battleState.streakBonus,
      achievements: []
    };

    const achievements = BattleService.checkAchievements(battleResults, state.user.streak);

    achievements.forEach(achievement => {
      dispatch({
        type: 'UNLOCK_ACHIEVEMENT',
        payload: achievement
      });
    });

    return {
      ...battleResults,
      coinsEarned: battleResults.coinsEarned + (isVictory ? BATTLE_CONFIG.rewards.victoryBonus.coins : 0),
      achievements
    };
  }, [battleState.score, battleState.streakBonus, battleState.questions.length, dispatch, state.user.streak]);

  return {
    battleState,
    setBattleState,
    handleAnswer,
    endBattle
  };
} 