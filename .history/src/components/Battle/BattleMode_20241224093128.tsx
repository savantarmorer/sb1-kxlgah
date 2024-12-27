import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { BattleHand } from './BattleHand';
import { BattleArena } from './BattleArena';
import { BattleFooter } from './BattleFooter';
import { QuestionDisplay } from './QuestionDisplay';
import { BattleResults } from './BattleResults';
import { BattleAnimation } from './BattleAnimation';
import { createDeck, drawCards, calculateDamage, getAICardSelection } from '../../utils/cardUtils';
import type { BattleState, BattlePhase } from '../../types/battle';
import type { Card } from '../../utils/cardUtils';
import { BATTLE_CONFIG } from '../../config/battle';
import Confetti from 'react-confetti';

interface BattleModeProps {
  mode?: 'practice' | 'ranked' | 'tournament';
  on_close?: () => void;
}

const INITIAL_HEALTH = 20;
const INITIAL_HAND_SIZE = 4;

export default function BattleMode({ mode = 'practice', on_close }: BattleModeProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { state } = useAuth();
  const [battleState, setBattleState] = useState<BattleState>({
    status: 'waiting',
    phase: BattlePhase.READY,
    turn: 1,
    player1: {
      id: state.user?.id || '',
      health: INITIAL_HEALTH,
      shield: 0,
      deck: [],
      hand: [],
      selectedCard: undefined
    },
    player2: {
      id: 'bot',
      health: INITIAL_HEALTH,
      shield: 0,
      deck: [],
      hand: [],
      selectedCard: undefined
    },
    currentQuestion: null,
    winner: undefined
  });

  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(BATTLE_CONFIG.time_per_question);
  const [showBattleAnimation, setShowBattleAnimation] = useState(false);
  const [battleResult, setBattleResult] = useState<{
    attacker: 'player' | 'opponent';
    damage: number;
    effects: string[];
  } | null>(null);

  // Initialize battle
  useEffect(() => {
    if (!state.user) {
      navigate('/login');
      return;
    }

    // Create and shuffle decks
    const playerDeck = createDeck();
    const opponentDeck = createDeck();

    // Draw initial hands
    const { drawn: playerHand, remaining: playerRemaining } = drawCards(playerDeck, INITIAL_HAND_SIZE);
    const { drawn: opponentHand, remaining: opponentRemaining } = drawCards(opponentDeck, INITIAL_HAND_SIZE);

    setBattleState(prev => ({
      ...prev,
      status: 'active',
      player1: {
        ...prev.player1,
        deck: playerRemaining,
        hand: playerHand
      },
      player2: {
        ...prev.player2,
        deck: opponentRemaining,
        hand: opponentHand
      }
    }));
  }, [state.user, navigate]);

  // Handle card selection
  const handleCardSelect = (cardId: string) => {
    if (battleState.phase !== BattlePhase.CARD_SELECTION) return;

    setBattleState(prev => ({
      ...prev,
      player1: {
        ...prev.player1,
        selectedCard: cardId
      }
    }));

    // AI opponent selects a card
    const opponentCard = getAICardSelection(
      battleState.player2.hand,
      battleState.player1.hand.find(c => c.id === cardId),
      battleState.player2.health
    );

    setBattleState(prev => ({
      ...prev,
      player2: {
        ...prev.player2,
        selectedCard: opponentCard.id
      },
      phase: BattlePhase.QUESTION
    }));

    // Get a new question
    fetchQuestion();
  };

  // Handle answer submission
  const handleAnswer = async (answer: string) => {
    setSelectedAnswer(answer);
    
    // Simulate answer validation (replace with actual API call)
    const isCorrect = Math.random() > 0.5;
    
    if (isCorrect) {
      // Process battle round
      const playerCard = battleState.player1.hand.find(c => c.id === battleState.player1.selectedCard);
      const opponentCard = battleState.player2.hand.find(c => c.id === battleState.player2.selectedCard);
      
      if (playerCard && opponentCard) {
        const { damage, effects } = calculateDamage(playerCard, opponentCard);
        
        setShowBattleAnimation(true);
        setBattleResult({
          attacker: 'player',
          damage,
          effects
        });

        // Update health and process effects
        setBattleState(prev => {
          const newState = {
            ...prev,
            player2: {
              ...prev.player2,
              health: Math.max(0, prev.player2.health - damage)
            },
            phase: BattlePhase.RESOLUTION
          };

          // Check for game over
          if (newState.player2.health <= 0) {
            newState.status = 'completed';
            newState.winner = state.user?.id;
            setShowConfetti(true);
          }

          return newState;
        });
      }
    } else {
      // Process opponent's attack
      const playerCard = battleState.player1.hand.find(c => c.id === battleState.player1.selectedCard);
      const opponentCard = battleState.player2.hand.find(c => c.id === battleState.player2.selectedCard);
      
      if (playerCard && opponentCard) {
        const { damage, effects } = calculateDamage(opponentCard, playerCard);
        
        setShowBattleAnimation(true);
        setBattleResult({
          attacker: 'opponent',
          damage,
          effects
        });

        // Update health and process effects
        setBattleState(prev => {
          const newState = {
            ...prev,
            player1: {
              ...prev.player1,
              health: Math.max(0, prev.player1.health - damage)
            },
            phase: BattlePhase.RESOLUTION
          };

          // Check for game over
          if (newState.player1.health <= 0) {
            newState.status = 'completed';
            newState.winner = 'bot';
          }

          return newState;
        });
      }
    }
  };

  // Handle next turn
  const startNextTurn = () => {
    // Draw new cards
    const { drawn: playerDrawn, remaining: playerRemaining } = drawCards(battleState.player1.deck, 1);
    const { drawn: opponentDrawn, remaining: opponentRemaining } = drawCards(battleState.player2.deck, 1);

    setBattleState(prev => ({
      ...prev,
      turn: prev.turn + 1,
      phase: BattlePhase.CARD_SELECTION,
      player1: {
        ...prev.player1,
        deck: playerRemaining,
        hand: [...prev.player1.hand, ...playerDrawn].slice(0, 7), // Max hand size of 7
        selectedCard: undefined
      },
      player2: {
        ...prev.player2,
        deck: opponentRemaining,
        hand: [...prev.player2.hand, ...opponentDrawn].slice(0, 7),
        selectedCard: undefined
      }
    }));

    setSelectedAnswer('');
    setShowBattleAnimation(false);
    setBattleResult(null);
  };

  // Fetch a new question (replace with actual API call)
  const fetchQuestion = async () => {
    // Simulate API call
    const mockQuestion = {
      id: Math.random().toString(),
      text: "What is the capital of France?",
      options: [
        { id: "1", text: "London" },
        { id: "2", text: "Paris" },
        { id: "3", text: "Berlin" },
        { id: "4", text: "Madrid" }
      ],
      correct_answer: "2"
    };

    setBattleState(prev => ({
      ...prev,
      currentQuestion: mockQuestion
    }));
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ minHeight: '100vh', py: 4 }}>
        <AnimatePresence mode="wait">
          {battleState.status === 'active' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <BattleArena
                playerState={battleState.player1}
                opponentState={battleState.player2}
                currentUser={state.user}
                botAvatar="/bot-avatar.png"
              />

              {battleState.phase === BattlePhase.CARD_SELECTION && (
                <BattleHand
                  cards={battleState.player1.hand}
                  selectedCard={battleState.player1.selectedCard}
                  onSelectCard={handleCardSelect}
                />
              )}

              {battleState.phase === BattlePhase.QUESTION && battleState.currentQuestion && (
                <QuestionDisplay
                  question={battleState.currentQuestion}
                  on_answer={handleAnswer}
                  selected_answer={selectedAnswer}
                  time_left={timeLeft}
                />
              )}

              {battleState.phase === BattlePhase.RESOLUTION && (
                <Box sx={{ textAlign: 'center', my: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {battleResult?.effects.map((effect, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.2 }}
                      >
                        {effect}
                      </motion.div>
                    ))}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={startNextTurn}
                    sx={{ mt: 2 }}
                  >
                    Next Turn
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {battleState.status === 'completed' && (
            <BattleResults
              winner={battleState.winner === state.user?.id}
              score={battleState.player1.health}
              on_play_again={() => window.location.reload()}
              on_exit={on_close}
            />
          )}
        </AnimatePresence>

        <BattleFooter
          battleStats={{
            wins: state.battleStats?.wins || 0,
            rating: state.battleRatings?.rating || BATTLE_CONFIG.matchmaking.default_rating
          }}
          phase={battleState.phase}
        />

        {showBattleAnimation && battleResult && (
          <BattleAnimation
            attacker={battleResult.attacker}
            damage={battleResult.damage}
            playerAvatar={state.user?.avatar_url}
            opponentAvatar="/bot-avatar.png"
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
      </Box>
    </Container>
  );
}