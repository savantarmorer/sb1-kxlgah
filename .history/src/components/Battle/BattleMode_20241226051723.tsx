import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import { useTimer } from '../../hooks/useTimer';
import { useCardBattle } from '../../hooks/useCardBattle';
import { BattlePhase, BattleStatus, Question } from '../../types/battle';
import { BATTLE_CONFIG } from '../../config/battleConfig';
import { calculateDamage } from '../../utils/cardUtils';

type BattleMode = 'all' | 'constitutional' | 'criminal' | 'civil';

interface BattleModeProps {
  mode?: BattleMode;
}

interface PlayerState {
  health: number;
  shield: number;
  isReady: boolean;
}

export default function BattleMode({ mode = 'all' }: BattleModeProps) {
  const navigate = useNavigate();
  const { state } = useGame();
  const [phase, setPhase] = useState<BattlePhase>(BattlePhase.INITIALIZING);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [currentDamage, setCurrentDamage] = useState(0);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [streak, setStreak] = useState(0);
  
  const [playerState, setPlayerState] = useState<PlayerState>({
    health: BATTLE_CONFIG.initial_health,
    shield: 0,
    isReady: false
  });
  
  const [opponentState, setOpponentState] = useState<PlayerState>({
    health: BATTLE_CONFIG.initial_health,
    shield: 0,
    isReady: false
  });

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

  const {
    timeLeft,
    startTimer,
    pauseTimer,
    resetTimer,
    getTimeBonus
  } = useTimer(BATTLE_CONFIG.time_per_question);

  const handleAnswer = (answer: string) => {
    if (!currentQuestion) return;
    
    const isCorrect = answer.toUpperCase() === currentQuestion.correct_answer.toUpperCase();
    setIsAnswerCorrect(isCorrect);
    setSelectedAnswer(answer);
    
    const playerCard = playerHand.find(c => c.id === selectedCard);
    const opponentCard = opponentHand.find(c => c.id === opponentSelectedCard);
    
    if (!playerCard || !opponentCard) return;
    
    const damage = calculateDamage(playerCard, opponentCard).damage;
    setCurrentDamage(damage);
    
    if (isCorrect) {
      setOpponentState(prev => ({
        ...prev,
        health: Math.max(0, prev.health - damage)
      }));
      setScore(prev => ({ ...prev, player: prev.player + 1 }));
      setStreak(prev => prev + 1);
    } else {
      setPlayerState(prev => ({
        ...prev,
        health: Math.max(0, prev.health - damage)
      }));
      setScore(prev => ({ ...prev, opponent: prev.opponent + 1 }));
      setStreak(0);
    }
    
    setPhase(BattlePhase.RESOLUTION);
  };

  // Rest of the component code...
}