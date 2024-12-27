import { useCallback, useState } from 'react';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { useGame } from '../contexts/GameContext';
import { useBattleSound } from './useBattleSound';
import {
  BattleQuestion,
  BattlePhase,
  Card
} from '../types/battle';
import { calculateBattleRewards } from '../utils/battleUtils';
import { useCardBattle } from './useCardBattle';

interface BattleOptions {
  opponent_id?: string;
  is_bot?: boolean;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export function useBattle() {
  const { state } = useGame();
  const { play_sound } = useBattleSound();

  // Integrate card battle hook
  const {
    playerHand,
    opponentHand,
    selectedCard,
    opponentSelectedCard,
    initializeDecks,
    selectCard,
    selectOpponentCard,
    distributeCards,
    removeUsedCards
  } = useCardBattle();

  // Track if battle system is ready
  const [phase, setPhase] = useState<BattlePhase>(BattlePhase.INITIALIZING);
  const [currentQuestion, setCurrentQuestion] = useState<BattleQuestion | null>(null);
  const [timeLeft, setTimeLeft] = useState(BATTLE_CONFIG.time_per_question);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [currentDamage, setCurrentDamage] = useState(0);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [streak, setStreak] = useState(0);
  const [playerState, setPlayerState] = useState({ health: BATTLE_CONFIG.initial_health, shield: 0 });
  const [opponentState, setOpponentState] = useState({ health: BATTLE_CONFIG.initial_health, shield: 0 });

  const handleAnswer = useCallback((answer: string) => {
    if (!currentQuestion || !selectedCard || !opponentSelectedCard) return;

    const isCorrect = answer.toUpperCase() === currentQuestion.correct_answer.toUpperCase();
    setIsAnswerCorrect(isCorrect);

    // Calculate rewards including card effects
    const rewards = calculateBattleRewards(
      isCorrect,
      timeLeft,
      streak,
      state.battle?.metadata?.difficulty || 'medium'
    );

    // Update player states based on rewards metadata
    setPlayerState(prev => ({
      health: prev.health,
      shield: prev.shield + (rewards.metadata?.shield_gained || 0)
    }));

    setOpponentState(prev => ({
      health: prev.health - (rewards.metadata?.damage_dealt || 0),
      shield: prev.shield
    }));

    // Update score and streak
    if (isCorrect) {
      setScore(prev => ({ ...prev, player: prev.player + 1 }));
      setStreak(prev => prev + 1);
      play_sound('correct');
    } else {
      setStreak(0);
      play_sound('wrong');
    }

    // Move to resolution phase
    setPhase(BattlePhase.RESOLUTION);
    
    // Remove used cards
    removeUsedCards();
  }, [currentQuestion, selectedCard, opponentSelectedCard, timeLeft, streak, playerHand, opponentHand, play_sound, removeUsedCards, state.battle?.metadata?.difficulty]);

  const handleResolutionComplete = useCallback(() => {
    // Check if battle is over
    if (opponentState.health <= 0 || playerState.health <= 0) {
      setPhase(BattlePhase.COMPLETED);
      return;
    }

    // Move to card selection phase
    setPhase(BattlePhase.CARD_SELECTION);
    
    // Distribute new cards if needed
    distributeCards();
    
    // Reset for next round
    setSelectedAnswer('');
    setIsAnswerCorrect(null);
    setTimeLeft(BATTLE_CONFIG.time_per_question);
  }, [opponentState.health, playerState.health, distributeCards]);

  const initializeBattle = useCallback((mode: string) => {
    // Initialize battle state
    setPhase(BattlePhase.PREPARING);
    setScore({ player: 0, opponent: 0 });
    setStreak(0);
    setPlayerState({ health: BATTLE_CONFIG.initial_health, shield: 0 });
    setOpponentState({ health: BATTLE_CONFIG.initial_health, shield: 0 });
    
    // Initialize card decks
    initializeDecks();
    
    // Move to card selection phase
    setPhase(BattlePhase.CARD_SELECTION);
  }, [initializeDecks]);

  return {
    phase,
    currentQuestion,
    timeLeft,
    selectedAnswer,
    isAnswerCorrect,
    currentDamage,
    score,
    streak,
    playerState,
    opponentState,
    playerHand,
    opponentHand,
    selectedCard,
    opponentSelectedCard,
    handleAnswer,
    handleResolutionComplete,
    initializeBattle,
    selectCard,
    selectOpponentCard,
    setTimeLeft,
    setPhase
  };
}