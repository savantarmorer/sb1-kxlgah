import React, { useEffect, useState } from 'react';
import { Box, Container, useTheme, alpha, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import { BattlePhase } from '../../types/battle';
import { BattleHeader } from './BattleHeader';
import { BattleArena } from './BattleArena';
import { BattleTimer } from './BattleTimer';
import { BattleFooter } from './BattleFooter';
import { PreBattleLobby } from './PreBattleLobby';
import { QuestionDisplay } from './QuestionDisplay';
import { BattleResults } from './BattleResults';
import { BattleCard } from './BattleCard';
import { BattleHand } from './BattleHand';
import { CardDistribution } from './CardDistribution';
import { BattleResolution } from './BattleResolution';
import { useBattle } from '../../hooks/useBattle';
import { useCardBattle } from '../../hooks/useCardBattle';
import { useTimer } from '../../hooks/useTimer';
import { BATTLE_CONFIG } from '../../config/battleConfig';

interface BattleModeProps {
  mode?: 'all' | 'constitutional' | 'criminal' | 'civil';
  difficulty?: 'easy' | 'medium' | 'hard';
  is_bot?: boolean;
}

const CARD_WIDTH = 120;

export default function BattleMode({ mode = 'all', difficulty = 'medium', is_bot = true }: BattleModeProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { state } = useGame();
  const { showError } = useNotification();
  const [showConfetti, setShowConfetti] = useState(false);

  // Use the new hooks
  const {
    phase,
    currentQuestion,
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
    setPhase,
    setCurrentQuestion
  } = useBattle();

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
    timeLeft: questionTimeLeft,
    startTimer: startQuestionTimer,
    pauseTimer: pauseQuestionTimer,
    resetTimer: resetQuestionTimer,
    getTimeBonus
  } = useTimer(BATTLE_CONFIG.time_per_question);

  const {
    timeLeft: selectionTimeLeft,
    startTimer: startSelectionTimer,
    pauseTimer: pauseSelectionTimer,
    resetTimer: resetSelectionTimer
  } = useTimer(10); // 10 seconds for card selection

  useEffect(() => {
    if (phase !== BattlePhase.CARD_SELECTION || selectedCard) {
      pauseSelectionTimer();
      return;
    }

    startSelectionTimer();
  }, [phase, selectedCard, startSelectionTimer, pauseSelectionTimer]);

  useEffect(() => {
    if (selectionTimeLeft <= 1 && phase === BattlePhase.CARD_SELECTION && !selectedCard) {
      // Auto-select a random card if time runs out
      const availableCards = playerHand.filter(c => !selectedCard);
      if (availableCards.length > 0) {
        const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        selectCard(randomCard.id);
      }
    }
  }, [selectionTimeLeft, phase, selectedCard, playerHand, selectCard]);

  useEffect(() => {
    if (phase !== BattlePhase.QUESTION) {
      pauseQuestionTimer();
      return;
    }

    startQuestionTimer();
  }, [phase, startQuestionTimer, pauseQuestionTimer]);

  useEffect(() => {
    if (questionTimeLeft <= 1 && phase === BattlePhase.QUESTION) {
      // Auto-submit wrong answer if time runs out
      handleAnswer('');
    }
  }, [questionTimeLeft, phase, handleAnswer]);

  // Initialize battle mode
  useEffect(() => {
    if (phase === BattlePhase.INITIALIZING) {
      setPhase(BattlePhase.PREPARING);
    }
  }, [phase, setPhase]);

  // Update initializeBattle calls
  const handleBattleStart = () => {
    initializeBattle({ 
      difficulty,
      is_bot,
      category: mode === 'all' ? undefined : mode
    });
    initializeDecks();
  };

  // Handle opponent card selection and phase transition
  useEffect(() => {
    if (phase === BattlePhase.CARD_SELECTION && selectedCard) {
      const playerCard = playerHand.find(c => c.id === selectedCard);
      if (playerCard) {
        // First select opponent's card
        selectOpponentCard(playerCard);
        
        // Then transition to question phase after a short delay
        setTimeout(() => {
          const currentQuestionIndex = state.battle?.current_question ?? 0;
          const question = state.battle?.questions?.[currentQuestionIndex];
          
          if (!question) {
            console.error('[BattleMode] No question available for current battle');
            showError('Error: No question available');
            setPhase(BattlePhase.ERROR);
            return;
          }

          // Reset timers and states
          resetQuestionTimer();
          setSelectedAnswer('');
          
          // Set current question and transition to question phase
          setCurrentQuestion(question);
          setPhase(BattlePhase.QUESTION);
          startQuestionTimer();
        }, 500);
      }
    }
  }, [phase, selectedCard, playerHand, selectOpponentCard, setPhase, state.battle, showError, setCurrentQuestion, startQuestionTimer, resetQuestionTimer, setSelectedAnswer]);

  // Debug render
  console.debug('[BattleMode] Rendering:', { phase, currentQuestion, playerState, opponentState, selectedCard, opponentSelectedCard });

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
          {phase === BattlePhase.PREPARING && (
            <PreBattleLobby
              onBattleStart={handleBattleStart}
              onCancel={() => navigate(-1)}
              onModeSelect={(newMode) => setPhase(BattlePhase.PREPARING)}
              selectedMode={mode}
            />
          )}

          {phase === BattlePhase.DEALING && (
            <CardDistribution
              playerHand={playerHand}
              opponentHand={opponentHand}
              onComplete={distributeCards}
            />
          )}

          {(phase === BattlePhase.CARD_SELECTION || phase === BattlePhase.CARD_REVEAL) && (
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
                      onCardSelect={selectCard}
                      isSelectable={phase === BattlePhase.CARD_SELECTION}
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
                  <img src="/avatars/judge2.png" alt="Opponent" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

          {phase === BattlePhase.QUESTION && currentQuestion && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, p: 4 }}>
              <BattleTimer timeLeft={questionTimeLeft} isActive={!playerState.isReady} />
              
              <BattleArena
                playerState={playerState}
                opponentState={opponentState}
                currentUser={state.user}
                botAvatar="/avatars/judge2.png"
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
                question={{
                  ...currentQuestion,
                  alternative_a: currentQuestion.alternative_a || '',
                  alternative_b: currentQuestion.alternative_b || '',
                  alternative_c: currentQuestion.alternative_c || '',
                  alternative_d: currentQuestion.alternative_d || '',
                  correct_answer: currentQuestion.correct_answer.toUpperCase()
                }}
                onAnswer={handleAnswer}
                selectedAnswer={selectedAnswer}
                isCorrect={isAnswerCorrect}
                timeLeft={questionTimeLeft}
              />
            </Box>
          )}

          {phase === BattlePhase.COMPLETED && (
            <BattleResults
              score={score}
              streak={streak}
              on_play_again={handleBattleStart}
              on_exit={() => navigate('/battle')}
            />
          )}

          {phase === BattlePhase.RESOLUTION && selectedCard && opponentSelectedCard && (
            <BattleResolution
              isCorrect={isAnswerCorrect!}
              playerCard={playerHand.find(c => c.id === selectedCard)!}
              opponentCard={opponentHand.find(c => c.id === opponentSelectedCard)!}
              damage={currentDamage}
              newPlayerHealth={playerState.health}
              newOpponentHealth={opponentState.health}
              onComplete={() => {
                handleResolutionComplete();
                removeUsedCards();
              }}
            />
          )}
        </AnimatePresence>
      </Box>

      <BattleFooter
        battleStats={{
          wins: state.battle_stats?.wins || 0,
          rating: BATTLE_CONFIG.matchmaking.default_rating
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