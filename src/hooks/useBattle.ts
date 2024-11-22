import { useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import { BattleService } from '../services/battleService';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { BattleResults } from '../types/battle';
import { useLevelSystem } from './useLevelSystem';
import { useAchievements } from '../hooks/useAchievements';
import { useBattleSound } from '../hooks/useBattleSound';
import { RewardService } from '../services/rewardService';
import { useNotification } from '../contexts/NotificationContext';
import { useTranslation } from '../contexts/LanguageContext';

export function useBattle() {
  const { state, dispatch } = useGame();
  const { checkAchievements } = useAchievements();
  const { playSound } = useBattleSound();
  const { showNotification } = useNotification();
  const { t } = useTranslation();
  const { currentLevel, currentXP } = useLevelSystem();
  
  const handleAnswer = useCallback(async (answerIndex: number) => {
    if (!state.battle) return;

    const isCorrect = answerIndex === state.battle.questions[state.battle.currentQuestion].correctAnswer;
    const newScore = {
      player: state.battle.score.player + (isCorrect ? 1 : 0),
      opponent: state.battle.score.opponent + (Math.random() > 0.4 ? 1 : 0) // Opponent has 60% chance
    };

    // Update score and progress
    dispatch({
      type: 'UPDATE_BATTLE_PROGRESS',
      payload: {
        score: newScore,
        playerAnswers: [...state.battle.playerAnswers, isCorrect],
        currentQuestion: state.battle.currentQuestion + 1,
        timeLeft: BATTLE_CONFIG.timePerQuestion // Reset timer for next question
      }
    });

    playSound(isCorrect ? 'correct' : 'wrong');

    // Check if battle is complete
    if (state.battle.currentQuestion + 1 >= state.battle.questions.length) {
      const timeBonus = Math.max(0, state.battle.timeLeft || 0) * BATTLE_CONFIG.rewards.timeBonus.multiplier;
      const totalPlayerScore = newScore.player + (timeBonus / 10); // Convert time bonus to score points
      
      // Create battle results with correct score type
      const results: BattleResults = {
        isVictory: newScore.player > newScore.opponent,
        score: totalPlayerScore,
        playerScore: newScore.player,
        experienceGained: calculateXPGained(newScore.player, state.battle.questions.length),
        coinsEarned: calculateCoinsEarned(newScore.player, state.battle.questions.length),
        streakBonus: state.user.streak * BATTLE_CONFIG.rewards.streakBonus.multiplier,
        timeBonus,
        totalScore: Math.round(totalPlayerScore),
        totalQuestions: state.battle.questions.length,
        scorePercentage: (newScore.player / state.battle.questions.length) * 100,
        xpEarned: calculateXPGained(newScore.player, state.battle.questions.length),
        opponent: {
          id: state.battle.currentOpponent || 'bot',
          name: 'Opponent',
          rating: state.battle.opponentRating || 1000
        },
        rewards: {
          items: [],
          achievements: [],
          bonuses: [
            {
              type: 'streak',
              amount: state.user.streak * BATTLE_CONFIG.rewards.streakBonus.multiplier
            },
            {
              type: 'time',
              amount: timeBonus
            }
          ]
        }
      };

      dispatch({ type: 'END_BATTLE', payload: results });
      
      // Update battle stats
      await BattleService.updateStats(state.user.id, results, state.battleStats);
    }
  }, [state.battle, dispatch, playSound]);

  const initializeBattle = useCallback(async () => {
    try {
      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'searching' });
      
      // Get random questions
      const questions = await BattleService.getQuestions();
      
      dispatch({
        type: 'INITIALIZE_BATTLE',
        payload: {
          questions,
          timePerQuestion: BATTLE_CONFIG.timePerQuestion
        }
      });

      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'ready' });
      await new Promise(resolve => setTimeout(resolve, BATTLE_CONFIG.readyTime * 1000));
      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'battle' });

    } catch (error) {
      console.error('Battle initialization failed:', error);
      dispatch({ type: 'SET_BATTLE_STATUS', payload: 'completed' });
      throw error;
    }
  }, [dispatch]);

  // Timer update function
  const updateTimer = useCallback(() => {
    if (state.battle?.timeLeft && state.battle.timeLeft > 0) {
      dispatch({
        type: 'UPDATE_BATTLE_PROGRESS',
        payload: {
          timeLeft: state.battle.timeLeft - 1
        }
      });
    } else if (state.battle?.timeLeft === 0) {
      // Auto-submit wrong answer when time runs out
      handleAnswer(-1);
    }
  }, [state.battle, dispatch]);

  const calculateXPGained = (score: number, totalQuestions: number): number => {
    const baseXP = BATTLE_CONFIG.rewards.baseXP * (score / totalQuestions);
    return Math.round(baseXP);
  };

  const calculateCoinsEarned = (score: number, totalQuestions: number): number => {
    const baseCoins = BATTLE_CONFIG.rewards.baseCoins * (score / totalQuestions);
    return Math.round(baseCoins);
  };

  const handleBattleComplete = async (results: BattleResults) => {
    // Calculate rewards
    const rewards = RewardService.calculateBattleRewards(results);
    
    // Calculate total XP gain including bonuses
    const totalXPGain = rewards.reduce((sum, r) => 
      r.type === 'xp' ? sum + Number(r.value) : sum, 0
    );

    // Calculate total coins gain
    const totalCoinsGain = rewards.reduce((sum, r) => 
      r.type === 'coins' ? sum + Number(r.value) : sum, 0
    );

    // Update user stats with rewards
    dispatch({
      type: 'UPDATE_USER_STATS',
      payload: {
        xp: totalXPGain,
        coins: totalCoinsGain,
        streak: results.isVictory ? state.user.streak + 1 : 0
      }
    });

    // Update battle stats
    dispatch({
      type: 'UPDATE_BATTLE_STATS',
      payload: {
        totalBattles: state.battleStats.totalBattles + 1,
        wins: state.battleStats.wins + (results.isVictory ? 1 : 0),
        losses: state.battleStats.losses + (results.isVictory ? 0 : 1),
        winStreak: results.isVictory ? state.battleStats.winStreak + 1 : 0,
        highestStreak: Math.max(
          state.battleStats.highestStreak,
          results.isVictory ? state.battleStats.winStreak + 1 : state.battleStats.winStreak
        ),
        totalXpEarned: state.battleStats.totalXpEarned + totalXPGain,
        totalCoinsEarned: state.battleStats.totalCoinsEarned + totalCoinsGain
      }
    });

    // Show battle completion notification
    showNotification({
      type: 'battle',
      message: {
        title: results.isVictory ? t('battle.victory') : t('battle.defeat'),
        description: t('battle.completed'),
        rewards
      },
      duration: 5000
    });

    // Play appropriate sound
    playSound(results.isVictory ? 'victory' : 'defeat');

    // Check achievements after all updates
    checkAchievements();
  };

  return {
    battleState: state.battle,
    handleAnswer,
    initializeBattle,
    updateTimer
  };
}