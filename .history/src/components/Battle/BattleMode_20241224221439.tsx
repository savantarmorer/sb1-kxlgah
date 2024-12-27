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
import { BattleCard } from './BattleCard';
import { BattleHand } from './BattleHand';
import { createDeck, drawCards, calculateDamage, getAICardSelection } from '../../utils/cardUtils';
import type { Card } from '../../utils/cardUtils';
import { Button } from '../ui/Button';
import { CardDistribution } from './CardDistribution';
import { BattleResolution } from './BattleResolution';
import { calculateBattleRewards } from '../../utils/battleRewards';

export const BATTLE_PHASES = {
  LOADING: 'LOADING',
  PREPARING: 'PREPARING',
  DEALING: 'DEALING',
  SELECTION: 'SELECTION',
  CARD_SELECTION: 'CARD_SELECTION',
  CARD_REVEAL: 'CARD_REVEAL',
  QUESTION: 'QUESTION',
  RESOLUTION: 'RESOLUTION',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR'
} as const;

type BattlePhase = typeof BATTLE_PHASES[keyof typeof BATTLE_PHASES];
type BattleMode = 'all' | 'constitutional' | 'criminal' | 'civil';

interface BattleModeProps {
  mode?: BattleMode;
  showError: (message: string) => void;
}

const INITIAL_HAND_SIZE = 3;
const CARD_WIDTH = 120;

export default function BattleMode({ mode = 'all', showError }: BattleModeProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { state } = useGame();
  
  // Battle state
  const [phase, setPhase] = useState<BattlePhase>(BATTLE_PHASES.PREPARING);
  const [selectedMode, setSelectedMode] = useState<BattleMode>(mode);
  const [botAvatar] = useState<string>('/avatars/judge2.png');
  const [currentDamage, setCurrentDamage] = useState(0);

  // Player state
  const [playerState, setPlayerState] = useState<PlayerState>({ ...initialPlayerState });
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [playerDeck, setPlayerDeck] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<string | undefined>(undefined);

  // Opponent state
  const [opponentState, setOpponentState] = useState<PlayerState>({ ...initialPlayerState });
  const [opponentHand, setOpponentHand] = useState<Card[]>([]);
  const [opponentDeck, setOpponentDeck] = useState<Card[]>([]);
  const [opponentSelectedCard, setOpponentSelectedCard] = useState<string | undefined>(undefined);

  // Question state
  const [currentQuestion, setCurrentQuestion] = useState<BattleQuestion | null>(null);
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(BATTLE_CONFIG.time_per_question);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

  // UI state
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAnswerReveal, setShowAnswerReveal] = useState(false);
  const [selectionTimeLeft, setSelectionTimeLeft] = useState(10);

  // Handle card distribution completion
  const handleDistributionComplete = () => {
    setPhase(BATTLE_PHASES.CARD_SELECTION);
    setSelectionTimeLeft(10);
  };

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

  // Modified handleAnswer with proper phase transitions and rewards calculation
  const handleAnswer = async (answer: string) => {
    if (!currentQuestion || !selectedCard || !opponentSelectedCard) return;

    console.log('Selected answer:', answer);
    console.log('Correct answer:', currentQuestion.correct_answer);
    console.log('Current question:', currentQuestion);

    setSelectedAnswer(answer);
    // Map the selected alternative to its letter
    const answerLetter = answer.replace('alternative_', '').toUpperCase();
    const isCorrect = answerLetter === currentQuestion.correct_answer;
    setIsAnswerCorrect(isCorrect);

    // Move to resolution phase
    setPhase(BATTLE_PHASES.RESOLUTION);

    const playerCard = playerHand.find(c => c.id === selectedCard)!;
    const opponentCard = opponentHand.find(c => c.id === opponentSelectedCard)!;

    console.log('Battle action:', {
      playerCard: {
        action: playerCard.action,
        power: playerCard.power
      },
      opponentCard: {
        action: opponentCard.action,
        power: opponentCard.power
      },
      timeLeft,
      isCorrect
    });

    let damageDealt = 0;
    let damageTaken = 0;
    let shieldGained = 0;

    if (isCorrect) {
      // Calculate damage/shield based on time remaining
      if (playerCard.action === 'attack') {
        const damage = timeLeft;
        console.log('Player attacks:', { damage, timeLeft });
        setOpponentState(prev => ({
          ...prev,
          health: Math.max(0, prev.health - damage)
        }));
        setCurrentDamage(damage);
        damageDealt = damage;
      } else if (playerCard.action === 'defense') {
        const shield = timeLeft;
        console.log('Player defends:', { shield, timeLeft });
        setPlayerState(prev => ({
          ...prev,
          shield: Math.min(50, prev.shield + shield)
        }));
        setCurrentDamage(0);
        shieldGained = shield;
      } else if (playerCard.action === 'counter' && opponentCard.action === 'attack') {
        const damage = timeLeft;
        console.log('Player counters:', { damage, timeLeft, opponentAction: opponentCard.action });
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
      console.log('Wrong answer penalty:', { penalty });
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

    console.log('Battle rewards:', rewards);

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
  };

  const handleResolutionComplete = () => {
    // Remove used cards
    setPlayerHand(prev => prev.filter(c => c.id !== selectedCard));
    setOpponentHand(prev => prev.filter(c => c.id !== opponentSelectedCard));

    // Check if both players are out of cards
    const shouldReshuffle = playerHand.length <= 1 && opponentHand.length <= 1;

    if (shouldReshuffle) {
      // Reshuffle and draw new hands
      const newPlayerDeck = createDeck();
      const newOpponentDeck = createDeck();

      const { drawn: pHand } = drawCards(newPlayerDeck, INITIAL_HAND_SIZE);
      const { drawn: oHand } = drawCards(newOpponentDeck, INITIAL_HAND_SIZE);

      setPlayerHand(pHand);
      setOpponentHand(oHand);
      setPlayerDeck([]);
      setOpponentDeck([]);
    }

    // Move to next question
    const nextQuestionIndex = currentQuestionIndex + 1;
    if (nextQuestionIndex < questions.length) {
      setCurrentQuestionIndex(nextQuestionIndex);
      setCurrentQuestion(questions[nextQuestionIndex]);
      setTimeLeft(30); // Reset timer for next question
    }

    // Reset selections
    setSelectedCard(undefined);
    setOpponentSelectedCard(undefined);
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setCurrentDamage(0);

    // Check if game should end
    if (playerState.health <= 0 || opponentState.health <= 0) {
      setPhase(BATTLE_PHASES.COMPLETED);
    } else {
      // Move to next card selection
      setPhase(BATTLE_PHASES.CARD_SELECTION);
      setSelectionTimeLeft(10);
    }
  };

  // Initialize battle with cards
  const initializeBattle = async () => {
    try {
      setPhase(BATTLE_PHASES.PREPARING);

      const { data: questionsData, error: dbError } = await supabase
        .from('battle_questions')
        .select('*')
        .eq(selectedMode !== 'all' ? 'category' : 'id', selectedMode !== 'all' ? selectedMode : 'id')
        .limit(50);

      if (dbError) {
        const errorMessage = dbError instanceof Error ? dbError.message : 'Database error occurred';
        console.error('Database error:', dbError);
        showError(`Error fetching questions: ${errorMessage}`);
        setPhase(BATTLE_PHASES.ERROR);
        return;
      }

      if (!questionsData || questionsData.length === 0) {
        const errorMessage = `No questions available for ${selectedMode} mode`;
        console.error(errorMessage);
        showError(errorMessage);
        setPhase(BATTLE_PHASES.ERROR);
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
      setIsAnswerCorrect(false);
      setStreak(0);

      // Initialize player states
      setPlayerState({ health: 50, shield: 0, isReady: false });
      setOpponentState({ health: 50, shield: 0, isReady: false });

      // Initialize decks and hands
      const playerDeck = createDeck();
      const opponentDeck = createDeck();
      
      const { drawn: playerInitialHand } = drawCards(playerDeck, INITIAL_HAND_SIZE);
      const { drawn: opponentInitialHand } = drawCards(opponentDeck, INITIAL_HAND_SIZE);

      setPlayerDeck(playerDeck);
      setOpponentDeck(opponentDeck);
      setPlayerHand(playerInitialHand);
      setOpponentHand(opponentInitialHand);

      setPhase(BATTLE_PHASES.DEALING);
      setSelectionTimeLeft(10);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error initializing battle:', error);
      showError(`Error initializing battle: ${errorMessage}`);
      setPhase(BATTLE_PHASES.ERROR);
    }
  };

  // Add a timer effect for questions
  useEffect(() => {
    if (phase !== BATTLE_PHASES.QUESTION) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit wrong answer if time runs out
          handleAnswer('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, currentQuestion]);

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
          {phase === BATTLE_PHASES.PREPARING && (
            <PreBattleLobby
              onBattleStart={initializeBattle}
              onCancel={() => navigate(-1)}
              onModeSelect={setSelectedMode}
              selectedMode={selectedMode}
            />
          )}

          {phase === BATTLE_PHASES.DEALING && (
            <CardDistribution
              playerHand={playerHand}
              opponentHand={opponentHand}
              onComplete={handleDistributionComplete}
            />
          )}

          {(phase === BATTLE_PHASES.CARD_SELECTION || phase === BATTLE_PHASES.CARD_REVEAL) && (
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
                      onCardSelect={handleCardSelect}
                      isSelectable={phase === BATTLE_PHASES.CARD_SELECTION}
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
                      power={playerHand.find(c => c.id === selectedCard)?.power || 0}
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

          {phase === BATTLE_PHASES.QUESTION && currentQuestion && (
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
                  power={playerHand.find(c => c.id === selectedCard)?.power || 0}
                  effect={playerHand.find(c => c.id === selectedCard)?.effect}
                />
                <BattleCard
                  isFlipped={true}
                  isWinner={false}
                  action={opponentHand.find(c => c.id === opponentSelectedCard)?.action || 'attack'}
                  power={opponentHand.find(c => c.id === opponentSelectedCard)?.power || 0}
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

          {phase === BATTLE_PHASES.COMPLETED && (
            <BattleResults
              score={score}
              streak={streak}
              on_play_again={initializeBattle}
              on_exit={() => navigate('/battle')}
            />
          )}

          {phase === BATTLE_PHASES.RESOLUTION && selectedCard && opponentSelectedCard && (
            <BattleResolution
              isCorrect={isAnswerCorrect!}
              playerCard={playerHand.find(c => c.id === selectedCard)!}
              opponentCard={opponentHand.find(c => c.id === opponentSelectedCard)!}
              damage={currentDamage}
              newPlayerHealth={playerState.health}
              newOpponentHealth={opponentState.health}
              onComplete={handleResolutionComplete}
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