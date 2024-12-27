import React, { useState, useCallback, useEffect } from 'react';
import { Box, Container, useTheme, alpha, Typography, LinearProgress, Avatar, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabase';
import { 
  BattleQuestion,
  BattleAction,
  ACTION_ADVANTAGES,
  BattleCard as BattleCardType
} from '../../types/battle';
import { BATTLE_CONFIG } from '../../config/battleConfig';
import { BattleHeader } from './BattleHeader';
import { BattleArena } from './BattleArena';
import { BattleTimer } from './BattleTimer';
import { BattleFooter } from './BattleFooter';
import { PreBattleLobby } from './PreBattleLobby';
import { QuestionDisplay } from './QuestionDisplay';
import { BattleResults } from './BattleResults';
import { BattleAnimation } from './BattleAnimation';
import { BattleCard } from './BattleCard';
import { BattleActions } from './BattleActions';

type BattleMode = 'all' | 'constitutional' | 'criminal' | 'civil';

// Card types
type CardType = 'ataque' | 'defesa' | 'contra_ataque' | 'wildcard';

interface Card {
  id: string;
  type: CardType;
  power: number;
  isWildcard: boolean;
  isUsed: boolean;
  description: string;
}

// Battle phases
enum BattlePhase {
  PREPARING = 'PREPARING',
  INITIALIZING = 'INITIALIZING',
  CARD_DISTRIBUTION = 'CARD_DISTRIBUTION',
  ACTION_SELECTION = 'ACTION_SELECTION',
  QUESTION = 'QUESTION',
  ANIMATION = 'ANIMATION',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

interface BattleModeProps {
  mode?: BattleMode;
}

interface PlayerState {
  health: number;
  shield: number;
  selectedCard: Card | null;
  hand: Card[];
  isReady: boolean;
  answer: string | null;
  isCorrect: boolean | null;
  timeLeft: number;
  selectedAction: CardType | null;
}

const initialPlayerState: PlayerState = {
  health: 100,
  shield: 0,
  selectedCard: null,
  hand: [],
  isReady: false,
  answer: null,
  isCorrect: null,
  timeLeft: BATTLE_CONFIG.time_per_question,
  selectedAction: null
};

// Card generation utilities
const generateCard = (type: CardType, isWildcard: boolean = false): Card => ({
  id: Math.random().toString(36).substr(2, 9),
  type,
  power: Math.floor(Math.random() * 20) + 10, // Random power between 10-30
  isWildcard,
  isUsed: false,
  description: getCardDescription(type, isWildcard)
});

const getCardDescription = (type: CardType, isWildcard: boolean): string => {
  if (isWildcard) return 'Carta coringa que pode ser usada como qualquer tipo de ação';
  
  switch (type) {
    case 'ataque':
      return 'Causa dano ao oponente se a resposta estiver correta';
    case 'defesa':
      return 'Gera escudo para absorver dano';
    case 'contra_ataque':
      return 'Reflete o dano do ataque do oponente se a resposta estiver correta';
    default:
      return '';
  }
};

const generateInitialHand = (): Card[] => {
  const hand: Card[] = [
    ...Array(2).fill(null).map(() => generateCard('ataque')),
    ...Array(2).fill(null).map(() => generateCard('defesa')),
    ...Array(2).fill(null).map(() => generateCard('contra_ataque')),
    generateCard(
      ['ataque', 'defesa', 'contra_ataque'][Math.floor(Math.random() * 3)] as CardType,
      true
    )
  ];
  return hand.sort(() => Math.random() - 0.5); // Shuffle the hand
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
  const [selectedMode, setSelectedMode] = useState<BattleMode>(mode);

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
      setTimeLeft(10); // 10 seconds for card selection
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
      }, 1500);

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

          {phase === BattlePhase.READY && currentQuestion && (
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 2fr 1fr',
              gap: 2,
              p: 4,
              height: '100%'
            }}>
              {/* Left Column - Player */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <BattleArena
                  playerState={playerState}
                  currentUser={state.user}
                  isOpponent={false}
                />
                <BattleCard
                  isFlipped={playerCardFlipped}
                  isWinner={battleResult?.attacker === 'player'}
                  action={playerState.selectedAction || '?'}
                  showBack={false}
                />
                <BattleActions
                  selectedAction={playerState.selectedAction}
                  onSelectAction={handleSelectAction}
                  isReady={playerState.isReady}
                  onReady={handleReady}
                  disabled={!selectedAnswer}
                />
              </Box>

              {/* Middle Column - Question */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <BattleTimer timeLeft={timeLeft} isActive={!playerState.isReady} />
                <QuestionDisplay
                  question={currentQuestion}
                  on_answer={handleAnswer}
                  selected_answer={selectedAnswer}
                  is_correct={playerState.isCorrect}
                  time_left={timeLeft}
                />
              </Box>

              {/* Right Column - Opponent */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <BattleArena
                  playerState={opponentState}
                  botAvatar={botAvatar}
                  isOpponent={true}
                />
                <BattleCard
                  isFlipped={opponentCardFlipped}
                  isWinner={battleResult?.attacker === 'opponent'}
                  action={opponentState.selectedAction || '?'}
                  showBack={!opponentState.isReady}
                />
              </Box>
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