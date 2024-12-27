import React, { useEffect, useState, useCallback } from 'react';
import { Box, Container, useTheme, alpha, Typography, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import { useNotification } from '../../contexts/NotificationContext';
import { use_language } from '../../contexts/LanguageContext';
import { BattleStateEnum, type BattleRewards } from '../../types/battle';
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
import { BattleErrorBoundary } from './BattleErrorBoundary';
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
  const { state, dispatch } = useGame();
  const { showError } = useNotification();
  const [showConfetti, setShowConfetti] = useState(false);
  const { t } = use_language();
  const [error, setError] = useState<string | null>(null);

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
    setPhaseWithValidation,
    setCurrentQuestion,
    isReady
  } = useBattle();

  const {
    initializeDecks,
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

  // Selection timer management
  useEffect(() => {
    if (phase === BattleStateEnum.CARD_SELECTION) {
      resetSelectionTimer();
      startSelectionTimer();
    } else {
      pauseSelectionTimer();
    }

    return () => {
      pauseSelectionTimer();
    };
  }, [phase, startSelectionTimer, pauseSelectionTimer, resetSelectionTimer]);

  // Auto-select card when selection timer runs out
  useEffect(() => {
    if (selectionTimeLeft <= 1 && phase === BattleStateEnum.CARD_SELECTION && !selectedCard) {
      const availableCards = playerHand.filter(c => !selectedCard);
      if (availableCards.length > 0) {
        const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        selectCard(randomCard.id);
      }
    }
  }, [selectionTimeLeft, phase, selectedCard, playerHand, selectCard]);

  // Question timer management
  useEffect(() => {
    if (phase === BattleStateEnum.QUESTION) {
      resetQuestionTimer();
      startQuestionTimer();
    } else {
      pauseQuestionTimer();
    }

    return () => {
      pauseQuestionTimer();
    };
  }, [phase, startQuestionTimer, pauseQuestionTimer, resetQuestionTimer]);

  // Auto-submit answer when question timer runs out
  useEffect(() => {
    if (questionTimeLeft <= 1 && phase === BattleStateEnum.QUESTION) {
      handleAnswer('');
    }
  }, [questionTimeLeft, phase, handleAnswer]);

  // Initialize battle mode
  useEffect(() => {
    if (phase === BattleStateEnum.INITIALIZING) {
      initializeBattle({ 
        difficulty,
        is_bot,
        category: mode === 'all' ? undefined : mode
      });
    }
  }, [phase, initializeBattle, difficulty, is_bot, mode]);

  // Handle opponent card selection
  useEffect(() => {
    let questionTimer: NodeJS.Timeout;
    
    if (phase === BattleStateEnum.CARD_SELECTION && selectedCard) {
      const playerCard = playerHand.find(c => c.id === selectedCard);
      if (playerCard) {
        console.debug('[BattleMode] Player card selected, selecting opponent card...');
        
        // Select opponent's card first
        selectOpponentCard(playerCard);
        
        // Wait for opponent card selection animation
        const timer = setTimeout(async () => {
          try {
            // First transition to card reveal
            const success = await setPhaseWithValidation(BattleStateEnum.CARD_REVEAL);
            
            if (success) {
              // Get the current question ready
              const currentQuestionIndex = state.battle?.current_question ?? 0;
              const question = state.battle?.questions?.[currentQuestionIndex];
              
              if (question) {
                // Set the current question
                await setCurrentQuestion(question);
                
                // Add delay before transitioning to question phase
                questionTimer = setTimeout(async () => {
                  if (phase === BattleStateEnum.CARD_REVEAL) {
                    await setPhaseWithValidation(BattleStateEnum.QUESTION);
                  }
                }, 2000); // Increased delay to 2 seconds for better visibility
              } else {
                console.error('[BattleMode] No question available');
                showError(t('battle.error.no_question'));
                await setPhaseWithValidation(BattleStateEnum.ERROR);
              }
            }
          } catch (error) {
            console.error('[BattleMode] Phase transition failed:', error);
            showError(t('battle.error.phase_transition'));
            await setPhaseWithValidation(BattleStateEnum.ERROR);
          }
        }, 500); // Short delay for opponent card selection

        return () => {
          clearTimeout(timer);
          if (questionTimer) {
            clearTimeout(questionTimer);
          }
        };
      }
    }
  }, [phase, selectedCard, playerHand, selectOpponentCard, setPhaseWithValidation, setCurrentQuestion, state.battle?.current_question, state.battle?.questions, showError, t]);

  // Debug render - only log when phase changes
  useEffect(() => {
    console.debug('[BattleMode] State update:', { 
      phase,
      battleStatus: state.battle?.status,
      playerState: {
        health: playerState.health,
        shield: playerState.shield,
        isReady: playerState.isReady
      },
      opponentState: {
        health: opponentState.health,
        shield: opponentState.shield,
        isReady: opponentState.isReady
      },
      selectedCard,
      opponentSelectedCard,
      currentQuestion: currentQuestion ? {
        id: currentQuestion.id,
        category: currentQuestion.category
      } : null
    });
  }, [phase, state.battle?.status, playerState, opponentState, selectedCard, opponentSelectedCard, currentQuestion]);

  // Handle battle start
  const handleBattleStart = useCallback(async () => {
    try {
      console.debug('[BattleMode] Starting battle initialization...');
      
      // We should already be in DEALING phase from PreBattleLobby
      
      // Initialize the battle with options
      await initializeBattle({ 
        difficulty,
        is_bot,
        category: mode === 'all' ? undefined : mode
      });

      console.debug('[BattleMode] Battle initialized, initializing decks...');

      // Initialize decks
      await initializeDecks();

      // Set battle status to active
      dispatch({ type: 'SET_BATTLE_STATUS', payload: BattleStateEnum.ACTIVE });
      
      // Move to card selection phase (valid from DEALING)
      await setPhaseWithValidation(BattleStateEnum.CARD_SELECTION);

    } catch (error) {
      console.error('[BattleMode] Battle initialization failed:', error);
      showError(t('battle.error.initialization'));
      await setPhaseWithValidation(BattleStateEnum.ERROR);
    }
  }, [difficulty, is_bot, mode, initializeBattle, initializeDecks, setPhaseWithValidation, dispatch, showError, t]);

  useEffect(() => {
    // Example of handling phase transitions
    if (phase === BattleStateEnum.ERROR) {
      setError('An unexpected error occurred during the battle.');
    }
  }, [phase]);

  // Update battle mode through battle progress
  const handleModeSelect = useCallback((newMode: string) => {
    if (newMode !== mode) {
      dispatch({ 
        type: 'UPDATE_BATTLE_PROGRESS', 
        payload: { mode: newMode }
      });
    }
  }, [dispatch, mode]);

  // Handle card distribution completion
  const handleDistributionComplete = useCallback(async () => {
    try {
      console.debug('[BattleMode] Distribution complete, distributing cards...');
      
      // First distribute cards and wait for completion
      await distributeCards();
      
      console.debug('[BattleMode] Cards distributed, transitioning to card selection');
      
      // Then transition to card selection
      await setPhaseWithValidation(BattleStateEnum.CARD_SELECTION);
    } catch (error) {
      console.error('[BattleMode] Distribution completion failed:', error);
      showError(t('battle.error.distribution'));
      setPhaseWithValidation(BattleStateEnum.ERROR);
    }
  }, [distributeCards, setPhaseWithValidation, showError, t]);

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
          {phase === BattleStateEnum.PREPARING && (
            <PreBattleLobby
              onBattleStart={handleBattleStart}
              onCancel={() => navigate(-1)}
              onModeSelect={handleModeSelect}
              selectedMode={mode}
            />
          )}

          {phase === BattleStateEnum.DEALING && (
            <CardDistribution
              playerHand={playerHand}
              opponentHand={opponentHand}
              onComplete={handleDistributionComplete}
            />
          )}

          {(() => {
            const cardPhases = [BattleStateEnum.CARD_SELECTION, BattleStateEnum.CARD_REVEAL];
            return cardPhases.includes(phase) && (
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 2,
                height: '100%',
                p: 4,
                maxWidth: 1200,
                mx: 'auto'
              }>
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
                        isSelectable={phase === BattleStateEnum.CARD_SELECTION}
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
            );
          })()}

          {phase === BattleStateEnum.QUESTION && currentQuestion && (
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

          {phase === BattleStateEnum.COMPLETED && (
            <BattleResults
              score={score}
              streak={streak}
              on_play_again={handleBattleStart}
              on_exit={() => navigate('/battle')}
            />
          )}

          {phase === BattleStateEnum.RESOLUTION && selectedCard && opponentSelectedCard && (
            <BattleResolution
              isCorrect={isAnswerCorrect!}
              playerCard={playerHand.find(c => c.id === selectedCard)!}
              opponentCard={opponentHand.find(c => c.id === opponentSelectedCard)!}
              damage={currentDamage}
              newPlayerHealth={playerState.health}
              newOpponentHealth={opponentState.health}
              rewards={state.battle?.rewards || {
                xp_earned: 0,
                coins_earned: 0,
                streak_bonus: 0,
                time_bonus: 0,
                total_xp: 0,
                total_coins: 0
              }}
              onComplete={async () => {
                // First remove used cards
                await removeUsedCards();
                // Then handle resolution completion
                await handleResolutionComplete();
              }}
            />
          )}

          {error && (
            <BattleErrorBoundary 
              message={error}
              onRetry={handleBattleStart}
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