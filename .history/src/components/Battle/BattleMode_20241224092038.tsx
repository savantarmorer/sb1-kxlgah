import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabase';
import { BATTLE_CONFIG } from '../../config/battleConfig';
import { BattleQuestion } from '../../types/battle';
import { User } from '../../types/user';

// Battle phases
export enum BattlePhase {
  PREPARING = 'PREPARING',
  INITIALIZING = 'INITIALIZING',
  CARD_DISTRIBUTION = 'CARD_DISTRIBUTION',
  ACTION_SELECTION = 'ACTION_SELECTION',
  QUESTION = 'QUESTION',
  ANIMATION = 'ANIMATION',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// Card types and initial state
export type CardType = 'ataque' | 'defesa' | 'contra_ataque' | 'wildcard';

export interface Card {
  id: string;
  type: CardType;
  isWildcard: boolean;
  isUsed: boolean;
  power: number;
  description: string;
}

export interface PlayerState {
  health: number;
  shield: number;
  selectedCard: Card | null;
  selectedAction: CardType | null;
  answer: string | null;
  isReady: boolean;
  isCorrect: boolean;
  timeLeft: number;
  hand: Card[];
}

const generateInitialHand = (): Card[] => {
  const hand: Card[] = [];
  
  // Add 2 attack cards
  for (let i = 0; i < 2; i++) {
    hand.push({
      id: `attack-${i}`,
      type: 'ataque',
      isWildcard: false,
      isUsed: false,
      power: 20,
      description: 'Causa dano ao oponente'
    });
  }
  
  // Add 2 defense cards
  for (let i = 0; i < 2; i++) {
    hand.push({
      id: `defense-${i}`,
      type: 'defesa',
      isWildcard: false,
      isUsed: false,
      power: 15,
      description: 'Bloqueia dano e ganha escudo'
    });
  }
  
  // Add 2 counter cards
  for (let i = 0; i < 2; i++) {
    hand.push({
      id: `counter-${i}`,
      type: 'contra_ataque',
      isWildcard: false,
      isUsed: false,
      power: 25,
      description: 'Contra-ataca com dano aumentado'
    });
  }
  
  // Add 1 wildcard
  hand.push({
    id: 'wildcard-0',
    type: 'wildcard',
    isWildcard: true,
    isUsed: false,
    power: 30,
    description: 'Pode ser usado como qualquer tipo de carta'
  });
  
  return hand.sort(() => Math.random() - 0.5);
};

export interface BattleModeProps {
  mode?: 'all' | 'constitutional' | 'civil' | 'criminal' | 'administrative';
}

const initialPlayerState: PlayerState = {
  health: 100,
  shield: 0,
  selectedCard: null,
  selectedAction: null,
  answer: null,
  isReady: false,
  isCorrect: false,
  timeLeft: 0,
  hand: []
};

export default function BattleMode({ mode = 'all' }: BattleModeProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { state } = useGame();
  const { showError } = useNotification();
  
  // Battle state
  const [botAvatar, setBotAvatar] = useState<string>('/avatars/judge2.png');
  const [phase, setPhase] = useState<BattlePhase>(BattlePhase.PREPARING);
  const [currentQuestion, setCurrentQuestion] = useState<BattleQuestion | null>(null);
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(BATTLE_CONFIG.time_per_question);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const [selectedMode, setSelectedMode] = useState<string>(mode);

  // Player states
  const [playerState, setPlayerState] = useState<PlayerState>(initialPlayerState);
  const [opponentState, setOpponentState] = useState<PlayerState>(initialPlayerState);

  // Animation states
  const [showBattleAnimation, setShowBattleAnimation] = useState(false);
  const [showCardReveal, setShowCardReveal] = useState(false);
  const [isDistributingCards, setIsDistributingCards] = useState(false);
  const [battleResult, setBattleResult] = useState<{
    attacker: 'player' | 'opponent';
    damage: number;
    shieldBlock?: number;
    shieldBreak?: number;
  } | null>(null);

  // Check authentication on mount
  useEffect(() => {
    if (!state.user) {
      navigate('/login');
    }
  }, [state.user, navigate]);

  // Timer effect for action selection
  useEffect(() => {
    if (phase !== BattlePhase.ACTION_SELECTION || playerState.isReady) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          
          // Auto-select a random card if player hasn't chosen
          if (!playerState.selectedCard) {
            const availableCards = playerState.hand.filter(card => !card.isUsed);
            if (availableCards.length > 0) {
              const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
              handleCardSelect(randomCard);
            }
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, playerState.isReady, playerState.selectedCard]);

  // Initialize battle with card distribution
  const initializeBattle = useCallback(async () => {
    try {
      setPhase(BattlePhase.INITIALIZING);
      
      let query = supabase
        .from('battle_questions')
        .select('*')
        .limit(BATTLE_CONFIG.questions_per_battle);

      if (selectedMode !== 'all') {
        query = query.eq('category', selectedMode);
      }

      const { data: questions, error } = await query.order('id', { ascending: false });

      if (error) throw error;
      
      if (!questions || questions.length === 0) {
        throw new Error(`No questions available for ${selectedMode} mode`);
      }

      const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);

      setQuestions(shuffledQuestions);
      setCurrentQuestion(shuffledQuestions[0]);
      setCurrentQuestionIndex(0);
      setTimeLeft(BATTLE_CONFIG.cards.card_selection_time);
      setScore({ player: 0, opponent: 0 });
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
      setStreak(0);

      // Initialize hands
      setPlayerState(prev => ({
        ...initialPlayerState,
        hand: generateInitialHand()
      }));
      setOpponentState(prev => ({
        ...initialPlayerState,
        hand: generateInitialHand()
      }));
      
      // Start card distribution animation
      setIsDistributingCards(true);
      setTimeout(() => {
        setIsDistributingCards(false);
        setPhase(BattlePhase.ACTION_SELECTION);
      }, BATTLE_CONFIG.cards.animation_duration);

    } catch (error) {
      console.error('Error initializing battle:', error);
      showError('Failed to initialize battle');
      setPhase(BattlePhase.ERROR);
    }
  }, [showError, selectedMode]);

  const handleCardSelect = (card: Card) => {
    if (phase !== BattlePhase.ACTION_SELECTION || playerState.isReady) return;

    setPlayerState(prev => ({
      ...prev,
      selectedCard: card,
      selectedAction: card.type
    }));
  };

  const handleReady = () => {
    if (!playerState.selectedCard || phase !== BattlePhase.ACTION_SELECTION) return;

    // Update player state
    setPlayerState(prev => ({
      ...prev,
      isReady: true,
      hand: prev.hand.map(card => 
        card.id === prev.selectedCard?.id ? { ...card, isUsed: true } : card
      )
    }));

    // Show card reveal animation
    setShowCardReveal(true);

    // Prepare bot's response
    const availableCards = opponentState.hand.filter(card => !card.isUsed);
    const botCard = availableCards[Math.floor(Math.random() * availableCards.length)];
    
    setOpponentState(prev => ({
      ...prev,
      selectedCard: botCard,
      selectedAction: botCard.type,
      isReady: true,
      hand: prev.hand.map(card => 
        card.id === botCard.id ? { ...card, isUsed: true } : card
      )
    }));

    // Transition to question phase
    setTimeout(() => {
      setShowCardReveal(false);
      setPhase(BattlePhase.QUESTION);
      setTimeLeft(BATTLE_CONFIG.time_per_question);
    }, BATTLE_CONFIG.cards.flip_animation_duration);
  };

  const handleAnswer = (answer: string) => {
    if (!currentQuestion || playerState.isReady) return;

    setSelectedAnswer(answer);
    const isCorrect = answer === currentQuestion.correct_answer;
    setIsAnswerCorrect(isCorrect);

    // Update player state with answer
    setPlayerState(prev => ({
      ...prev,
      answer,
      isCorrect
    }));

    // Bot answer logic
    const botAccuracy = BATTLE_CONFIG.bot.base_accuracy + 
      (BATTLE_CONFIG.bot.accuracy_multiplier * (state.battleRatings?.rating || BATTLE_CONFIG.matchmaking.default_rating) / 1000);
    
    const botIsCorrect = Math.random() < botAccuracy;
    const botAnswer = botIsCorrect ? currentQuestion.correct_answer : 
      ['A', 'B', 'C', 'D'].filter(a => a !== currentQuestion.correct_answer)[
        Math.floor(Math.random() * 3)
      ];

    setOpponentState(prev => ({
      ...prev,
      answer: botAnswer,
      isCorrect: botIsCorrect
    }));

    // Process battle round
    processBattleRound();
  };

  const processBattleRound = () => {
    if (!playerState.selectedCard || !opponentState.selectedCard) return;

    const playerCard = playerState.selectedCard;
    const opponentCard = opponentState.selectedCard;

    // Calculate damage and effects
    let damage = 0;
    let shieldBlock = 0;
    let attacker: 'player' | 'opponent' = 'player';

    if (!playerState.isCorrect && !opponentState.isCorrect) {
      // Both wrong - both take damage
      damage = BATTLE_CONFIG.combat.both_wrong_damage;
      setPlayerState(prev => ({ ...prev, health: prev.health - damage }));
      setOpponentState(prev => ({ ...prev, health: prev.health - damage }));
    } else if (playerState.isCorrect && !opponentState.isCorrect) {
      // Player correct, opponent wrong - player attacks
      damage = calculateDamage(playerCard, opponentCard);
      attacker = 'player';
      applyDamage('opponent', damage);
    } else if (!playerState.isCorrect && opponentState.isCorrect) {
      // Opponent correct, player wrong - opponent attacks
      damage = calculateDamage(opponentCard, playerCard);
      attacker = 'opponent';
      applyDamage('player', damage);
    } else {
      // Both correct - compare card types and timing
      if (playerState.timeLeft > opponentState.timeLeft) {
        damage = calculateDamage(playerCard, opponentCard);
        attacker = 'player';
        applyDamage('opponent', damage);
      } else {
        damage = calculateDamage(opponentCard, playerCard);
        attacker = 'opponent';
        applyDamage('player', damage);
      }
    }

    // Update battle result for animation
    setBattleResult({
      attacker,
      damage,
      shieldBlock,
      shieldBreak: damage - shieldBlock
    });

    // Show battle animation
    setShowBattleAnimation(true);
    setTimeout(() => {
      setShowBattleAnimation(false);
      setBattleResult(null);
      checkBattleEnd();
    }, BATTLE_CONFIG.cards.animation_duration);
  };

  const calculateDamage = (attackerCard: Card, defenderCard: Card): number => {
    let baseDamage = attackerCard.power;
    
    // Apply wildcard bonus
    if (attackerCard.isWildcard) {
      baseDamage *= BATTLE_CONFIG.combat.wildcard_bonus;
    }

    // Apply counter attack bonus
    if (attackerCard.type === 'contra_ataque' && defenderCard.type === 'ataque') {
      baseDamage *= BATTLE_CONFIG.combat.counter_multiplier;
    }

    return Math.round(baseDamage);
  };

  const applyDamage = (target: 'player' | 'opponent', damage: number) => {
    const setState = target === 'player' ? setPlayerState : setOpponentState;
    const state = target === 'player' ? playerState : opponentState;

    if (state.selectedCard?.type === 'defesa') {
      // Apply shield
      const shieldAmount = BATTLE_CONFIG.combat.base_shield;
      const remainingDamage = Math.max(0, damage - shieldAmount);
      setState(prev => ({
        ...prev,
        shield: prev.shield + shieldAmount - damage,
        health: prev.health - remainingDamage
      }));
    } else {
      // Take full damage
      setState(prev => ({
        ...prev,
        health: prev.health - damage
      }));
    }
  };

  const checkBattleEnd = () => {
    if (playerState.health <= 0 || opponentState.health <= 0) {
      setPhase(BattlePhase.COMPLETED);
      if (opponentState.health <= 0) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } else {
      // Prepare next round
      setCurrentQuestionIndex(prev => prev + 1);
      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestion(questions[currentQuestionIndex + 1]);
        setSelectedAnswer(null);
        setIsAnswerCorrect(null);
        setTimeLeft(BATTLE_CONFIG.cards.card_selection_time);
        setPhase(BattlePhase.ACTION_SELECTION);
        
        // Reset states for next round
        setPlayerState(prev => ({
          ...prev,
          selectedCard: null,
          selectedAction: null,
          answer: null,
          isReady: false,
          isCorrect: false
        }));
        setOpponentState(prev => ({
          ...prev,
          selectedCard: null,
          selectedAction: null,
          answer: null,
          isReady: false,
          isCorrect: false
        }));
      } else {
        setPhase(BattlePhase.COMPLETED);
      }
    }
  };

  return (
    <div>
      {/* Implement your JSX here */}
    </div>
  );
}