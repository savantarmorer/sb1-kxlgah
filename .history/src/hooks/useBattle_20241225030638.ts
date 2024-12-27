import { useState, useCallback } from 'react';
import { BattleQuestion, PlayerState, BattlePhase, calculateBattleRewards } from '../types/battle';
import { supabase } from '../lib/supabase';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { useNotification } from '../contexts/NotificationContext';
import { Card } from '../utils/cardUtils';

export function useBattle() {
  const { showError } = useNotification();

  // Battle state
  const [phase, setPhase] = useState<BattlePhase>(BattlePhase.PREPARING);
  const [currentQuestion, setCurrentQuestion] = useState<BattleQuestion | null>(null);
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(BATTLE_CONFIG.time_per_question);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [currentDamage, setCurrentDamage] = useState(0);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [streak, setStreak] = useState(0);

  // Player states
  const [playerState, setPlayerState] = useState<PlayerState>({ health: 50, shield: 0, isReady: false });
  const [opponentState, setOpponentState] = useState<PlayerState>({ health: 50, shield: 0, isReady: false });

  const handleAnswer = useCallback(async (answer: string, selectedCard: string, opponentSelectedCard: string, playerHand: Card[], opponentHand: Card[]) => {
    if (!currentQuestion) return;

    setSelectedAnswer(answer);
    // Map the selected alternative to its letter
    const answerLetter = answer.replace('alternative_', '').toUpperCase();
    const isCorrect = answerLetter === currentQuestion.correct_answer;
    setIsAnswerCorrect(isCorrect);

    // Move to resolution phase
    setPhase(BattlePhase.RESOLUTION);

    const playerCard = playerHand.find(c => c.id === selectedCard)!;
    const opponentCard = opponentHand.find(c => c.id === opponentSelectedCard)!;

    let damageDealt = 0;
    let damageTaken = 0;
    let shieldGained = 0;

    if (isCorrect) {
      // Calculate damage/shield based on time remaining
      if (playerCard.action === 'attack') {
        const damage = timeLeft;
        setOpponentState(prev => ({
          ...prev,
          health: Math.max(0, prev.health - damage)
        }));
        setCurrentDamage(damage);
        damageDealt = damage;
      } else if (playerCard.action === 'defense') {
        const shield = timeLeft;
        setPlayerState(prev => ({
          ...prev,
          shield: Math.min(50, prev.shield + shield)
        }));
        setCurrentDamage(0);
        shieldGained = shield;
      } else if (playerCard.action === 'counter' && opponentCard.action === 'attack') {
        const damage = timeLeft;
        setOpponentState(prev => ({
          ...prev,
          health: Math.max(0, prev.health - damage)
        }));
        setCurrentDamage(damage);
        damageDealt = damage;
      }
    } else {
      // Wrong answer penalty
      const penalty = 5;
      setPlayerState(prev => ({
        ...prev,
        health: Math.max(0, prev.health - penalty)
      }));
      setCurrentDamage(penalty);
      damageTaken = penalty;
    }

    // Calculate battle rewards
    const rewards = calculateBattleRewards(
      isCorrect,
      timeLeft,
      streak,
      currentQuestion.difficulty
    );

    // Update rewards metadata with battle stats
    rewards.metadata = {
      ...rewards.metadata,
      damage_dealt: damageDealt,
      damage_taken: damageTaken,
      shield_gained: shieldGained
    };

    // Update score and streak
    setScore(prev => ({
      player: prev.player + rewards.total_xp,
      opponent: prev.opponent
    }));

    if (isCorrect) {
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }
  }, [currentQuestion, timeLeft, streak]);

  const handleResolutionComplete = useCallback(() => {
    // Move to next question
    const nextQuestionIndex = currentQuestionIndex + 1;
    if (nextQuestionIndex < questions.length) {
      setCurrentQuestionIndex(nextQuestionIndex);
      setCurrentQuestion(questions[nextQuestionIndex]);
      setTimeLeft(30); // Reset timer for next question
    }

    // Reset selections
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setCurrentDamage(0);

    // Check if game should end
    if (playerState.health <= 0 || opponentState.health <= 0) {
      setPhase(BattlePhase.COMPLETED);
    } else {
      // Move to next card selection
      setPhase(BattlePhase.CARD_SELECTION);
    }
  }, [currentQuestionIndex, questions.length, playerState.health, opponentState.health]);

  const initializeBattle = useCallback(async (selectedMode: string) => {
    try {
      setPhase(BattlePhase.PREPARING);

      let query = supabase
        .from('battle_questions')
        .select('*')
        .limit(50);

      // Only apply category filter if not in 'all' mode
      if (selectedMode !== 'all') {
        // Map the mode to the actual category names in the database
        const categoryMap: { [key: string]: string } = {
          'constitutional': 'Direito Constitucional',
          'civil': 'Direito Civil',
          'criminal': 'Direito Penal'
        };

        const categoryToFilter = categoryMap[selectedMode];
        if (categoryToFilter) {
          query = query.eq('category', categoryToFilter);
        }
      }

      const { data: questionsData, error: dbError } = await query;

      if (dbError) {
        console.error('Database error:', dbError);
        showError?.(`Error fetching questions: ${dbError.message}`);
        setPhase(BattlePhase.ERROR);
        return;
      }

      if (!questionsData || questionsData.length === 0) {
        const errorMessage = `No questions available for ${selectedMode} mode`;
        console.error(errorMessage);
        showError?.(errorMessage);
        setPhase(BattlePhase.ERROR);
        return;
      }

      // Initialize battle state
      const questions = questionsData as BattleQuestion[];
      setQuestions(questions);
      setCurrentQuestion(questions[0]);
      setCurrentQuestionIndex(0);
      setTimeLeft(30);
      setScore({ player: 0, opponent: 0 });
      setSelectedAnswer('');
      setIsAnswerCorrect(null);
      setStreak(0);

      // Initialize player states
      setPlayerState({ health: 50, shield: 0, isReady: false });
      setOpponentState({ health: 50, shield: 0, isReady: false });

      setPhase(BattlePhase.DEALING);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error initializing battle:', error);
      showError?.(`Error initializing battle: ${errorMessage}`);
      setPhase(BattlePhase.ERROR);
    }
  }, [showError]);

  return {
    phase,
    currentQuestion,
    questions,
    currentQuestionIndex,
    timeLeft,
    selectedAnswer,
    isAnswerCorrect,
    currentDamage,
    score,
    streak,
    playerState,
    opponentState,
    handleAnswer,
    handleResolutionComplete,
    initializeBattle,
    setTimeLeft,
    setPhase
  };
}