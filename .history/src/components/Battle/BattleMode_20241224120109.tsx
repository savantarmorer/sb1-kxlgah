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
  ACTION_ADVANTAGES
} from '../../types/battle';
import { BATTLE_CONFIG } from '../../config/battleConfig';
import { BattleHeader } from './BattleHeader';
import { BattleArena } from './BattleArena';
import { BattleTimer } from './BattleTimer';
import { BattleFooter } from './BattleFooter';
import { PreBattleLobby } from './PreBattleLobby';
import { QuestionDisplay } from './QuestionDisplay';
import { BattleResults } from './BattleResults';
import { BattleActions } from './BattleActions';
import { BattleAnimation } from './BattleAnimation';
import { BattleCard } from './BattleCard';
import { BattleHand } from './BattleHand';
import { createDeck, drawCards, calculateDamage, getAICardSelection } from '../../utils/cardUtils';
import type { Card } from '../../utils/cardUtils';
import { Button } from '../ui/Button';
import { CardDistribution } from './CardDistribution';

type BattleMode = 'all' | 'constitutional' | 'criminal' | 'civil';

interface BattleModeProps {
  mode?: BattleMode;
}

const INITIAL_HAND_SIZE = 4;
const CARD_WIDTH = 120;

// Update the battle phases
const BATTLE_PHASES = {
  PREPARING: 'PREPARING',
  DEALING: 'DEALING',
  CARD_SELECTION: 'CARD_SELECTION',
  CARD_REVEAL: 'CARD_REVEAL',
  QUESTION: 'QUESTION',
  RESOLUTION: 'RESOLUTION',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR'
} as const;

// Define phase type to ensure type safety
type BattlePhaseType = typeof BATTLE_PHASES[keyof typeof BATTLE_PHASES];

export default function BattleMode({ mode = 'all' }: BattleModeProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { state } = useGame();
  const { showError } = useNotification();
  
  // Existing state
  const [botAvatar, setBotAvatar] = useState<string>('/avatars/judge2.png');
  const [phase, setPhase] = useState<BattlePhaseType>(BATTLE_PHASES.PREPARING);
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
  const [showAnswerReveal, setShowAnswerReveal] = useState(false);
  const [showBattleAnimation, setShowBattleAnimation] = useState(false);
  const [battleResult, setBattleResult] = useState<{
    attacker: 'player' | 'opponent';
    damage: number;
    shieldBlock?: number;
    shieldBreak?: number;
  } | null>(null);

  // New card system state
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [opponentHand, setOpponentHand] = useState<Card[]>([]);
  const [playerDeck, setPlayerDeck] = useState<Card[]>([]);
  const [opponentDeck, setOpponentDeck] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<string | undefined>(undefined);
  const [opponentSelectedCard, setOpponentSelectedCard] = useState<string | undefined>(undefined);

  // Timer for card selection
  const [selectionTimeLeft, setSelectionTimeLeft] = useState(10);

  // Handle card distribution completion
  const handleDistributionComplete = useCallback(() => {
    setPhase(BATTLE_PHASES.CARD_SELECTION);
    setSelectionTimeLeft(10);
  }, []);

  // Selection timer effect with proper phase check
  useEffect(() => {
    if (phase !== BATTLE_PHASES.CARD_SELECTION || selectedCard) return;

    const timer = setInterval(() => {
      setSelectionTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-select a random card if time runs out
          const availableCards = playerHand.filter(c => !selectedCard);
          if (availableCards.length > 0) {
            const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
            handleCardSelect(randomCard.id);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, selectedCard, playerHand]);

  // Modified handleCardSelect with proper phase management
  const handleCardSelect = (cardId: string) => {
    if (selectedCard || phase !== BATTLE_PHASES.CARD_SELECTION) return;
    
    setSelectedCard(cardId);
    
    // AI opponent selects a card
    const playerCard = playerHand.find(c => c.id === cardId);
    const opponentCard = getAICardSelection(opponentHand, playerCard, opponentState.health);
    setOpponentSelectedCard(opponentCard.id);

    // Move to card reveal phase
    setPhase(BATTLE_PHASES.CARD_REVEAL);
    
    // After reveal animation, move to question phase
    setTimeout(() => {
      setPhase(BATTLE_PHASES.QUESTION);
      // Reset selection timer
      setSelectionTimeLeft(10);
    }, 2000);
  };

  // Modified handleAnswer with proper phase transitions
  const handleAnswer = async (answer: string) => {
    if (!currentQuestion || !selectedCard || !opponentSelectedCard) return;

    setSelectedAnswer(answer);
    const isCorrect = answer === currentQuestion.correct_answer;
    setIsAnswerCorrect(isCorrect);

    // Move to resolution phase
    setPhase(BATTLE_PHASES.RESOLUTION);

    const playerCard = playerHand.find(c => c.id === selectedCard)!;
    const opponentCard = opponentHand.find(c => c.id === opponentSelectedCard)!;

    if (isCorrect) {
      // Player attacks
      const { damage, effects } = calculateDamage(playerCard, opponentCard);
      setShowBattleAnimation(true);
      setBattleResult({
        attacker: 'player',
        damage,
        shieldBlock: opponentCard.action === 'defense' ? opponentCard.power : 0
      });

      setOpponentState(prev => ({
        ...prev,
        health: Math.max(0, prev.health - damage)
      }));
    } else {
      // Opponent attacks
      const { damage, effects } = calculateDamage(opponentCard, playerCard);
      setShowBattleAnimation(true);
      setBattleResult({
        attacker: 'opponent',
        damage,
        shieldBlock: playerCard.action === 'defense' ? playerCard.power : 0
      });

      setPlayerState(prev => ({
        ...prev,
        health: Math.max(0, prev.health - damage)
      }));
    }

    // After resolution animation, prepare for next round or end game
    setTimeout(() => {
      // Remove used cards and draw new ones
      setPlayerHand(prev => prev.filter(c => c.id !== selectedCard));
      setOpponentHand(prev => prev.filter(c => c.id !== opponentSelectedCard));

      const { drawn: playerDrawn, remaining: playerRemaining } = drawCards(playerDeck, 1);
      const { drawn: opponentDrawn, remaining: opponentRemaining } = drawCards(opponentDeck, 1);

      setPlayerHand(prev => [...prev, ...playerDrawn]);
      setOpponentHand(prev => [...prev, ...opponentDrawn]);
      setPlayerDeck(playerRemaining);
      setOpponentDeck(opponentRemaining);

      // Reset selections
      setSelectedCard(undefined);
      setOpponentSelectedCard(undefined);
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);

      // Check if game should end
      if (playerState.health <= 0 || opponentState.health <= 0) {
        setPhase(BATTLE_PHASES.COMPLETED);
      } else {
        // Move to next card selection
        setPhase(BATTLE_PHASES.CARD_SELECTION);
        setSelectionTimeLeft(10);
      }
    }, 3000);
  };

  // Initialize battle with cards
  const initializeBattle = useCallback(async () => {
    try {
      setPhase(BATTLE_PHASES.DEALING);
      
      // Initialize decks
      const newPlayerDeck = createDeck();
      const newOpponentDeck = createDeck();

      // Draw initial hands
      const { drawn: pHand, remaining: pDeck } = drawCards(newPlayerDeck, INITIAL_HAND_SIZE);
      const { drawn: oHand, remaining: oDeck } = drawCards(newOpponentDeck, INITIAL_HAND_SIZE);

      setPlayerHand(pHand);
      setOpponentHand(oHand);
      setPlayerDeck(pDeck);
      setOpponentDeck(oDeck);

      // Existing initialization
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
      setTimeLeft(BATTLE_CONFIG.time_per_question);
      setScore({ player: 0, opponent: 0 });
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
      setStreak(0);
      
      // Start dealing animation
      setPhase(BATTLE_PHASES.DEALING);
    } catch (error) {
      console.error('Error initializing battle:', error);
      showError('Failed to initialize battle');
      setPhase(BATTLE_PHASES.ERROR);
    }
  }, [showError, selectedMode]);

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
          {phase === 'PREPARING' && (
            <PreBattleLobby
              onBattleStart={initializeBattle}
              onCancel={() => navigate(-1)}
              onModeSelect={setSelectedMode}
              selectedMode={selectedMode}
            />
          )}

          {phase === 'DEALING' && (
            <CardDistribution
              playerCards={playerHand}
              opponentCardCount={opponentHand.length}
              onComplete={handleDistributionComplete}
            />
          )}

          {(phase === 'CARD_SELECTION' || phase === 'CARD_REVEAL') && (
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 2,
              height: '100%',
              p: 4,
              maxWidth: 1200,
              mx: 'auto'
            }}>
              {/* Time Remaining */}
              <Box sx={{ 
                position: 'absolute',
                top: 16,
                left: 16,
                right: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Typography variant="subtitle1" color="text.secondary">
                  Time Remaining
                </Typography>
                <Box sx={{ 
                  width: 200,
                  height: 8,
                  bgcolor: 'background.default',
                  borderRadius: 4,
                  overflow: 'hidden'
                }}>
                  <Box
                    component={motion.div}
                    initial={{ width: '100%' }}
                    animate={{ width: `${(selectionTimeLeft / 10) * 100}%` }}
                    transition={{ duration: 1 }}
                    sx={{
                      height: '100%',
                      bgcolor: selectionTimeLeft <= 3 ? 'error.main' : 'success.main',
                      borderRadius: 4
                    }}
                  />
                </Box>
                <Typography variant="subtitle1" color="text.secondary">
                  {selectionTimeLeft}s
                </Typography>
              </Box>

              {/* Left Column - Player Profile and Hand */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: 2,
                height: '100%',
                px: 2
              }}>
                {/* Player Profile */}
                <Box sx={{ 
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid',
                  borderColor: 'primary.main'
                }}>
                  <img src={state.user?.avatar_url} alt="Player" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
                <Typography variant="h6">Player</Typography>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" color="text.secondary">HP</Typography>
                  <Box sx={{ 
                    width: '100%',
                    height: 8,
                    bgcolor: 'background.default',
                    borderRadius: 4,
                    overflow: 'hidden',
                    mb: 1
                  }}>
                    <Box sx={{ 
                      width: `${(playerState.health / 50) * 100}%`,
                      height: '100%',
                      bgcolor: 'error.main',
                      borderRadius: 4
                    }} />
                  </Box>
                  <Typography variant="caption" sx={{ float: 'right' }}>{playerState.health}/50</Typography>
                </Box>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" color="text.secondary">Shield</Typography>
                  <Box sx={{ 
                    width: '100%',
                    height: 8,
                    bgcolor: 'background.default',
                    borderRadius: 4,
                    overflow: 'hidden',
                    mb: 1
                  }}>
                    <Box sx={{ 
                      width: `${(playerState.shield / 50) * 100}%`,
                      height: '100%',
                      bgcolor: 'info.main',
                      borderRadius: 4
                    }} />
                  </Box>
                  <Typography variant="caption" sx={{ float: 'right' }}>{playerState.shield}/50</Typography>
                </Box>

                {/* Player's Hand */}
                <Box sx={{ mt: 'auto', mb: 4, width: '100%' }}>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                    Your Hand
                  </Typography>
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    mx: 'auto',
                    maxWidth: 360
                  }}>
                    <BattleHand
                      cards={playerHand.slice(0, 3)}
                      selectedCard={selectedCard}
                      onSelectCard={handleCardSelect}
                      isDisabled={phase !== 'CARD_SELECTION'}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Middle Column - Selected Card */}
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                px: 2
              }}>
                <Typography variant="h6" color="text.secondary">
                  Selected Card
                </Typography>
                <Box sx={{ 
                  display: 'flex',
                  gap: 4,
                  alignItems: 'center'
                }}>
                  {selectedCard ? (
                    <BattleCard
                      isFlipped={false}
                      isWinner={false}
                      action={playerHand.find(c => c.id === selectedCard)?.action || 'attack'}
                      power={playerHand.find(c => c.id === selectedCard)?.power}
                      effect={playerHand.find(c => c.id === selectedCard)?.effect}
                    />
                  ) : (
                    <Box sx={{ 
                      width: CARD_WIDTH,
                      height: 160,
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Typography color="text.secondary">Select a card</Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Right Column - Opponent Profile and Hand */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: 2,
                height: '100%',
                px: 2
              }}>
                {/* Opponent Profile */}
                <Box sx={{ 
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid',
                  borderColor: 'primary.main'
                }}>
                  <img src={botAvatar} alt="Opponent" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
                <Typography variant="h6">Opponent</Typography>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" color="text.secondary">HP</Typography>
                  <Box sx={{ 
                    width: '100%',
                    height: 8,
                    bgcolor: 'background.default',
                    borderRadius: 4,
                    overflow: 'hidden',
                    mb: 1
                  }}>
                    <Box sx={{ 
                      width: `${(opponentState.health / 50) * 100}%`,
                      height: '100%',
                      bgcolor: 'error.main',
                      borderRadius: 4
                    }} />
                  </Box>
                  <Typography variant="caption" sx={{ float: 'right' }}>{opponentState.health}/50</Typography>
                </Box>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" color="text.secondary">Shield</Typography>
                  <Box sx={{ 
                    width: '100%',
                    height: 8,
                    bgcolor: 'background.default',
                    borderRadius: 4,
                    overflow: 'hidden',
                    mb: 1
                  }}>
                    <Box sx={{ 
                      width: `${(opponentState.shield / 50) * 100}%`,
                      height: '100%',
                      bgcolor: 'info.main',
                      borderRadius: 4
                    }} />
                  </Box>
                  <Typography variant="caption" sx={{ float: 'right' }}>{opponentState.shield}/50</Typography>
                </Box>

                {/* Opponent's Hand */}
                <Box sx={{ mt: 'auto', mb: 4, width: '100%' }}>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                    Opponent's Hand
                  </Typography>
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    gap: -30,
                    mx: 'auto',
                    maxWidth: 360
                  }}>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Box
                        key={`opponent-card-${index}`}
                        sx={{
                          width: CARD_WIDTH,
                          height: 160,
                          bgcolor: theme.palette.grey[900],
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid',
                          borderColor: alpha(theme.palette.primary.light, 0.3),
                          ml: index > 0 ? -30 : 0,
                        }}
                      >
                        <Typography
                          variant="h2"
                          sx={{
                            color: alpha(theme.palette.primary.light, 0.5),
                            fontWeight: 'bold',
                            userSelect: 'none'
                          }}
                        >
                          ?
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {phase === 'QUESTION' && currentQuestion && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, p: 4 }}>
              <BattleTimer timeLeft={timeLeft} isActive={!playerState.isReady} />
              
              <BattleArena
                playerState={playerState}
                opponentState={opponentState}
                currentUser={state.user}
                botAvatar={botAvatar}
              />

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                <BattleCard
                  isFlipped={true}
                  isWinner={false}
                  action={playerHand.find(c => c.id === selectedCard)?.action || 'attack'}
                  power={playerHand.find(c => c.id === selectedCard)?.power}
                  effect={playerHand.find(c => c.id === selectedCard)?.effect}
                />
                <BattleCard
                  isFlipped={true}
                  isWinner={false}
                  action={opponentHand.find(c => c.id === opponentSelectedCard)?.action || 'attack'}
                  power={opponentHand.find(c => c.id === opponentSelectedCard)?.power}
                  effect={opponentHand.find(c => c.id === opponentSelectedCard)?.effect}
                />
              </Box>

              <QuestionDisplay
                question={currentQuestion}
                on_answer={handleAnswer}
                selected_answer={selectedAnswer}
                is_correct={isAnswerCorrect}
                time_left={timeLeft}
              />
            </Box>
          )}

          {phase === 'COMPLETED' && (
            <BattleResults
              score={score}
              streak={streak}
              on_play_again={initializeBattle}
              on_exit={() => navigate('/battle')}
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