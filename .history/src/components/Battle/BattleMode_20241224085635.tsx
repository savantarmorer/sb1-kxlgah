import React, { useState, useCallback, useEffect } from 'react';
import { Box, Container, useTheme, alpha, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabase';
import { 
  BattleQuestion, 
  BattlePhase,
  PlayerState,
  BattleAction,
  initialPlayerState,
  ACTION_ADVANTAGES,
  BattleCard
} from '../../types/battle';
import { BATTLE_CONFIG } from '../../config/battleConfig';
import { createDeck, dealHand } from '../../utils/cardUtils';
import { BattleHeader } from './BattleHeader';
import { BattleArena } from './BattleArena';
import { BattleTimer } from './BattleTimer';
import { BattleFooter } from './BattleFooter';
import { PreBattleLobby } from './PreBattleLobby';
import { QuestionDisplay } from './QuestionDisplay';
import { BattleResults } from './BattleResults';
import { BattleAnimation } from './BattleAnimation';
import { BattleHand } from './BattleHand';

type BattleMode = 'all' | 'constitutional' | 'criminal' | 'civil';

interface BattleModeProps {
  mode?: BattleMode;
}

export default function BattleMode({ mode = 'all' }: BattleModeProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { state } = useGame();
  const { showError } = useNotification();
  
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
  const [selectedMode, setSelectedMode] = useState<BattleMode>(mode);
  const [playerState, setPlayerState] = useState<PlayerState>({ ...initialPlayerState });
  const [opponentState, setOpponentState] = useState<PlayerState>({ ...initialPlayerState });
  const [showBattleAnimation, setShowBattleAnimation] = useState(false);
  const [battleResult, setBattleResult] = useState<{
    attacker: 'player' | 'opponent';
    damage: number;
    shieldBlock?: number;
    shieldBreak?: number;
  } | null>(null);

  // Initialize battle with card system
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

      // Create deck and deal cards
      const deck = createDeck();
      const playerHand = dealHand(deck);
      const remainingDeck = deck.filter(card => !playerHand.includes(card));
      const opponentHand = dealHand(remainingDeck);

      setPlayerState(prev => ({
        ...prev,
        hand: {
          cards: playerHand,
          selectedCard: null
        }
      }));

      setOpponentState(prev => ({
        ...prev,
        hand: {
          cards: opponentHand,
          selectedCard: null
        }
      }));

      setQuestions(shuffledQuestions);
      setCurrentQuestion(shuffledQuestions[0]);
      setCurrentQuestionIndex(0);
      setTimeLeft(BATTLE_CONFIG.card_selection_time);
      setScore({ player: 0, opponent: 0 });
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
      setStreak(0);
      
      setTimeout(() => {
        setPhase(BattlePhase.CARD_SELECTION);
      }, 500);
    } catch (error) {
      console.error('Error initializing battle:', error);
      showError('Failed to initialize battle');
      setPhase(BattlePhase.ERROR);
    }
  }, [showError, selectedMode]);

  // Handle card selection phase
  useEffect(() => {
    if (phase !== BattlePhase.CARD_SELECTION) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          
          // Auto-select cards if not selected
          if (!playerState.hand.selectedCard) {
            const availableCards = playerState.hand.cards.filter(card => !card.isUsed);
            if (availableCards.length > 0) {
              const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
              handleCardSelect(randomCard);
            }
          }

          // Bot selects card
          const botCard = getBotCardSelection(
            opponentState.hand.cards,
            playerState.health,
            opponentState.health,
            BATTLE_CONFIG.bot.card_selection.strategic_weight
          );

          setOpponentState(prev => ({
            ...prev,
            hand: {
              ...prev.hand,
              selectedCard: botCard
            },
            selectedAction: botCard.type
          }));

          // Transition to question phase
          setPhase(BattlePhase.READY);
          setTimeLeft(BATTLE_CONFIG.time_per_question);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, playerState.hand.selectedCard]);

  const handleCardSelect = (card: BattleCard) => {
    if (phase !== BattlePhase.CARD_SELECTION || card.isUsed) return;

    setPlayerState(prev => ({
      ...prev,
      hand: {
        ...prev.hand,
        selectedCard: card
      },
      selectedAction: card.type
    }));
  };

  const handleAnswer = async (answer: string) => {
    if (!currentQuestion || playerState.isReady) return;

    setSelectedAnswer(answer);
    const isCorrect = answer.toUpperCase() === currentQuestion.correct_answer.toUpperCase();

    setPlayerState(prev => ({
      ...prev,
      answer,
      isCorrect
    }));
  };

  const handleReady = () => {
    console.log('handleReady called', { playerState, selectedAnswer, currentQuestion });
    if (!playerState.selectedAction || !selectedAnswer || !currentQuestion) {
      console.log('Ready check failed', { 
        hasAction: !!playerState.selectedAction, 
        hasAnswer: !!selectedAnswer, 
        hasQuestion: !!currentQuestion 
      });
      return;
    }

    // First, update player state
    const updatedPlayerState = {
      ...playerState,
      isReady: true,
      timeLeft
    };
    setPlayerState(updatedPlayerState);

    console.log('Player ready, preparing bot response');
    
    // Prepare bot's response
    const botAction = Object.keys(ACTION_ADVANTAGES)[Math.floor(Math.random() * 3)] as BattleAction;
    const botTimeLeft = Math.floor(Math.random() * timeLeft);
    
    const botAccuracy = BATTLE_CONFIG.bot.base_accuracy + 
    (BATTLE_CONFIG.bot.accuracy_multiplier * (state.battleRatings?.rating || BATTLE_CONFIG.matchmaking.default_rating) / 1000);
    const botCorrect = Math.random() < botAccuracy;
    
    let botAnswer: string;
    if (botCorrect) {
      botAnswer = currentQuestion.correct_answer;
    } else {
      const incorrectAnswers = ['A', 'B', 'C', 'D'].filter(a => a !== currentQuestion.correct_answer);
      botAnswer = incorrectAnswers[Math.floor(Math.random() * incorrectAnswers.length)];
    }
    
    console.log('Bot response ready:', { botAction, botAnswer, botCorrect });
    
    // Create updated opponent state
    const updatedOpponentState = {
      ...opponentState,
      selectedAction: botAction,
      answer: botAnswer,
      isReady: true,
      timeLeft: botTimeLeft,
      isCorrect: botCorrect
    };
    
    // Update opponent state
    setOpponentState(updatedOpponentState);

    // Wait a bit to ensure states are updated
    setTimeout(() => {
      setShowAnswerReveal(true);
      
      // Process battle round after animations
      setTimeout(() => {
        console.log('Processing battle round with states:', {
          player: updatedPlayerState,
          opponent: updatedOpponentState
        });
        setShowAnswerReveal(false);
        setShowBattleAnimation(true);
        processBattleRound(updatedPlayerState, updatedOpponentState);
      }, 2000);
    }, 1000);
  };

  const processBattleRound = async (currentPlayerState: PlayerState, currentOpponentState: PlayerState) => {
    console.log('processBattleRound started', { currentPlayerState, currentOpponentState });
    if (!currentPlayerState.selectedAction || !currentOpponentState.selectedAction) {
      console.log('Missing actions', { 
        playerAction: currentPlayerState.selectedAction, 
        opponentAction: currentOpponentState.selectedAction 
      });
      return;
    }

    // Determine attacker and defender based on rock-paper-scissors mechanic
    const playerAdvantage = ACTION_ADVANTAGES[currentPlayerState.selectedAction] === currentOpponentState.selectedAction;
    const opponentAdvantage = ACTION_ADVANTAGES[currentOpponentState.selectedAction] === currentPlayerState.selectedAction;
    
    let newPlayerState = { ...currentPlayerState };
    let newOpponentState = { ...currentOpponentState };

    // Both wrong - both take damage
    if (!currentPlayerState.isCorrect && !currentOpponentState.isCorrect) {
      console.log('Both wrong, both take damage');
      newPlayerState.health -= 10;
      newOpponentState.health -= 10;
      setBattleResult({ attacker: 'player', damage: 10 });
    }
    // Player has advantage - player attacks, opponent defends
    else if (playerAdvantage) {
      if (currentPlayerState.isCorrect) {
        // Player attacks successfully
        const damage = Math.ceil((currentPlayerState.timeLeft / BATTLE_CONFIG.time_per_question) * 20);
        const shieldBlock = Math.min(currentOpponentState.shield, damage);
        const actualDamage = Math.max(0, damage - shieldBlock);
        console.log('Player attacks:', { damage, shieldBlock, actualDamage });
        newOpponentState.health -= actualDamage;
        newOpponentState.shield = Math.max(0, currentOpponentState.shield - damage);
        setBattleResult({ attacker: 'player', damage: actualDamage, shieldBlock });
      }
      if (currentOpponentState.isCorrect) {
        // Opponent defends successfully
        const shieldGain = Math.ceil((currentOpponentState.timeLeft / BATTLE_CONFIG.time_per_question) * 20);
        console.log('Opponent gains shield:', shieldGain);
        newOpponentState.shield += shieldGain;
      }
    }
    // Opponent has advantage - opponent attacks, player defends
    else if (opponentAdvantage) {
      if (currentOpponentState.isCorrect) {
        // Opponent attacks successfully
        const damage = Math.ceil((currentOpponentState.timeLeft / BATTLE_CONFIG.time_per_question) * 20);
        const shieldBlock = Math.min(currentPlayerState.shield, damage);
        const actualDamage = Math.max(0, damage - shieldBlock);
        console.log('Opponent attacks:', { damage, shieldBlock, actualDamage });
        newPlayerState.health -= actualDamage;
        newPlayerState.shield = Math.max(0, currentPlayerState.shield - damage);
        setBattleResult({ attacker: 'opponent', damage: actualDamage, shieldBlock });
      }
      if (currentPlayerState.isCorrect) {
        // Player defends successfully
        const shieldGain = Math.ceil((currentPlayerState.timeLeft / BATTLE_CONFIG.time_per_question) * 20);
        console.log('Player gains shield:', shieldGain);
        newPlayerState.shield += shieldGain;
      }
    }
    // Same action - faster correct answer attacks
    else {
      if (currentPlayerState.isCorrect && currentOpponentState.isCorrect) {
        if (currentPlayerState.timeLeft > currentOpponentState.timeLeft) {
          // Player attacks
          const damage = Math.ceil((currentPlayerState.timeLeft / BATTLE_CONFIG.time_per_question) * 20);
          const shieldBlock = Math.min(currentOpponentState.shield, damage);
          const actualDamage = Math.max(0, damage - shieldBlock);
          console.log('Player faster, attacks:', { damage, shieldBlock, actualDamage });
          newOpponentState.health -= actualDamage;
          newOpponentState.shield = Math.max(0, currentOpponentState.shield - damage);
          setBattleResult({ attacker: 'player', damage: actualDamage, shieldBlock });
        } else {
          // Opponent attacks
          const damage = Math.ceil((currentOpponentState.timeLeft / BATTLE_CONFIG.time_per_question) * 20);
          const shieldBlock = Math.min(currentPlayerState.shield, damage);
          const actualDamage = Math.max(0, damage - shieldBlock);
          console.log('Opponent faster, attacks:', { damage, shieldBlock, actualDamage });
          newPlayerState.health -= actualDamage;
          newPlayerState.shield = Math.max(0, currentPlayerState.shield - damage);
          setBattleResult({ attacker: 'opponent', damage: actualDamage, shieldBlock });
        }
      } else if (currentPlayerState.isCorrect) {
        // Only player correct - player attacks
        const damage = Math.ceil((currentPlayerState.timeLeft / BATTLE_CONFIG.time_per_question) * 20);
        const shieldBlock = Math.min(currentOpponentState.shield, damage);
        const actualDamage = Math.max(0, damage - shieldBlock);
        console.log('Only player correct, attacks:', { damage, shieldBlock, actualDamage });
        newOpponentState.health -= actualDamage;
        newOpponentState.shield = Math.max(0, currentOpponentState.shield - damage);
        setBattleResult({ attacker: 'player', damage: actualDamage, shieldBlock });
      } else if (currentOpponentState.isCorrect) {
        // Only opponent correct - opponent attacks
        const damage = Math.ceil((currentOpponentState.timeLeft / BATTLE_CONFIG.time_per_question) * 20);
        const shieldBlock = Math.min(currentPlayerState.shield, damage);
        const actualDamage = Math.max(0, damage - shieldBlock);
        console.log('Only opponent correct, attacks:', { damage, shieldBlock, actualDamage });
        newPlayerState.health -= actualDamage;
        newPlayerState.shield = Math.max(0, currentPlayerState.shield - damage);
        setBattleResult({ attacker: 'opponent', damage: actualDamage, shieldBlock });
      }
    }

    console.log('Round results:', { newPlayerState, newOpponentState });

    setTimeout(() => {
      setPlayerState(newPlayerState);
      setOpponentState(newOpponentState);
      setShowBattleAnimation(false);
      setBattleResult(null);

      if (newPlayerState.health <= 0 || newOpponentState.health <= 0) {
        console.log('Battle ended:', { 
          playerHealth: newPlayerState.health, 
          opponentHealth: newOpponentState.health 
        });
        setPhase(BattlePhase.COMPLETED);
        if (newOpponentState.health <= 0) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
        return;
      }

      // Get next question
      console.log('Getting next question');
      let query = supabase
        .from('battle_questions')
        .select('*')
        .limit(1);

      if (selectedMode !== 'all') {
        query = query.eq('category', selectedMode);
      }

      query.then(({ data: questions, error }) => {
        if (error || !questions || questions.length === 0) {
          console.error('Error getting next question:', error);
          setPhase(BattlePhase.ERROR);
          return;
        }

        setCurrentQuestion(questions[0]);
        setTimeLeft(BATTLE_CONFIG.time_per_question);
        setSelectedAnswer(null);
        
        // Reset states for next round but keep health and shield
        setPlayerState(prev => ({
          ...prev,
          selectedAction: null,
          answer: null,
          isReady: false,
          isCorrect: false
        }));
        setOpponentState(prev => ({
          ...prev,
          selectedAction: null,
          answer: null,
          isReady: false,
          isCorrect: false
        }));
        
        setPhase(BattlePhase.READY);
      });
    }, 2000);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <BattleHeader />

      <Box sx={{ 
        position: 'relative',
        minHeight: '60vh',
        bgcolor: 'background.paper',
        borderRadius: 4,
        boxShadow: 1,
        overflow: 'hidden'
      }}>
        <AnimatePresence mode="wait">
          {phase === BattlePhase.INITIALIZING && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Initializing {selectedMode !== 'all' ? `${selectedMode} ` : ''}Battle...
              </Typography>
            </motion.div>
          )}

          {phase === BattlePhase.PREPARING && (
            <PreBattleLobby
              onBattleStart={initializeBattle}
              onCancel={() => navigate(-1)}
              onModeSelect={setSelectedMode}
              selectedMode={selectedMode}
            />
          )}

          {phase === BattlePhase.CARD_SELECTION && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, p: 4 }}>
              <BattleTimer 
                timeLeft={timeLeft} 
                isActive={true}
                label="Select Your Card"
              />
              
              <BattleArena
                playerState={playerState}
                opponentState={opponentState}
                currentUser={state.user}
                botAvatar={botAvatar}
              />

              <BattleHand
                hand={playerState.hand}
                isOpponent={false}
                onSelectCard={handleCardSelect}
                selectedCard={playerState.hand.selectedCard}
                isSelectionPhase={phase === BattlePhase.CARD_SELECTION}
              />

              <BattleHand
                hand={opponentState.hand}
                isOpponent={true}
                isSelectionPhase={phase === BattlePhase.CARD_SELECTION}
              />
            </Box>
          )}

          {phase === BattlePhase.READY && currentQuestion && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, p: 4 }}>
              <BattleTimer timeLeft={timeLeft} isActive={!playerState.isReady} />
              
              <BattleArena
                playerState={playerState}
                opponentState={opponentState}
                currentUser={state.user}
                botAvatar={botAvatar}
              />

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                <BattleHand
                  hand={playerState.hand}
                  isOpponent={false}
                  selectedCard={playerState.hand.selectedCard}
                  isSelectionPhase={false}
                />
                <BattleHand
                  hand={opponentState.hand}
                  isOpponent={true}
                  isSelectionPhase={false}
                />
              </Box>

              <QuestionDisplay
                question={currentQuestion}
                on_answer={handleAnswer}
                selected_answer={selectedAnswer}
                is_correct={playerState.isCorrect}
                time_left={timeLeft}
              />
            </Box>
          )}

          {phase === BattlePhase.COMPLETED && (
            <BattleResults
              score={score}
              streak={streak}
              on_play_again={initializeBattle}
              on_exit={() => navigate('/battle')}
            />
          )}

          {showBattleAnimation && battleResult && (
            <BattleAnimation
              attacker={battleResult.attacker}
              damage={battleResult.damage}
              playerAvatar={state.user?.avatar_url}
              opponentAvatar={botAvatar}
              shieldBlock={battleResult.shieldBlock}
              shieldBreak={battleResult.shieldBreak}
            />
          )}
        </AnimatePresence>
      </Box>

      <BattleFooter
        battleStats={{
          wins: state.battleStats?.wins || 0,
          rating: state.battleRatings?.rating || BATTLE_CONFIG.matchmaking.default_rating
        }}
        phase={phase}
      />

      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}
    </Container>
  );
}