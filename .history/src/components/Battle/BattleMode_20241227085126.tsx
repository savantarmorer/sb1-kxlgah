import React, { useEffect, useState } from 'react';
import { Box, Typography, Dialog, Button } from '@mui/material';
import { useGame } from '../../contexts/GameContext';
import { BattleStateEnum } from '../../types/battle';
import { useBattle } from '../../hooks/useBattle';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { CardDistribution } from './CardDistribution';
import { BattleArena } from './BattleArena';
import { PreBattleLobby } from './PreBattleLobby';
import { createDeck, drawCards, getAICardSelection } from '../../utils/cardUtils';
import type { Card } from '../../utils/cardUtils';

interface BattleModeProps {
  on_close?: () => void;
}

const WINNING_SCORE = 3;

export default function BattleMode({ on_close }: BattleModeProps) {
  const { state: gameState } = useGame();
  const { 
    initializeBattle,
    phase,
    state: battleState,
    dispatch
  } = useBattle();
  const { 
    joinQueue, 
    leaveQueue, 
    matchmakingState, 
    opponent 
  } = useMatchmaking();

  const [showLobby, setShowLobby] = useState(true);
  const [isDistributing, setIsDistributing] = useState(false);
  const [playerDeck, setPlayerDeck] = useState<Card[]>([]);
  const [opponentDeck, setOpponentDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [opponentHand, setOpponentHand] = useState<Card[]>([]);
  const [currentTurn, setCurrentTurn] = useState<'player' | 'opponent'>('player');
  const [lastPlayedCards, setLastPlayedCards] = useState<{
    player?: Card;
    opponent?: Card;
  }>();
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [showGameOver, setShowGameOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'opponent' | 'draw'>();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameState.user?.id) {
        leaveQueue();
      }
    };
  }, [gameState.user?.id, leaveQueue]);

  const handleBattleStart = async () => {
    try {
      // Create and shuffle decks
      const playerDeck = createDeck('promotoria');
      const opponentDeck = createDeck('defesa');
      
      // Draw initial hands
      const { drawn: pHand, remaining: pRemaining } = drawCards(playerDeck, 5);
      const { drawn: oHand, remaining: oRemaining } = drawCards(opponentDeck, 5);

      // Set decks and hands
      setPlayerDeck(pRemaining);
      setOpponentDeck(oRemaining);
      setPlayerHand(pHand);
      setOpponentHand(oHand);

      // Initialize battle state with bot opponent
      await initializeBattle({
        is_bot: true,
        difficulty: 'medium'
      });
      dispatch({ type: 'SET_BATTLE_STATUS', payload: BattleStateEnum.CARD_SELECTION });

      // Start battle
      setShowLobby(false);
      setIsDistributing(true);
      setCurrentTurn('player');
      setScore({ player: 0, opponent: 0 });
    } catch (error) {
      console.error('Failed to initialize battle:', error);
    }
  };

  const handleDistributionComplete = () => {
    setIsDistributing(false);
  };

  const handleCardSelect = async (cardId: string) => {
    if (!matchmakingState.matchId || phase !== BattleStateEnum.CARD_SELECTION) return;

    try {
      // Handle card selection
      // This will be implemented when we add the battle channel functionality
      console.log('Selected card:', cardId);
    } catch (error) {
      console.error('Failed to send card selection:', error);
    }
  };

  // Handle card play
  const handleCardPlay = async (cardId: string) => {
    if (currentTurn !== 'player') return;

    // Find and remove played card from hand
    const playedCard = playerHand.find(card => card.id === cardId);
    if (!playedCard) return;

    const newPlayerHand = playerHand.filter(card => card.id !== cardId);
    setPlayerHand(newPlayerHand);
    setLastPlayedCards({ player: playedCard });

    // Draw new card if available
    if (playerDeck.length > 0) {
      const { drawn, remaining } = drawCards(playerDeck, 1);
      setPlayerHand([...newPlayerHand, ...drawn]);
      setPlayerDeck(remaining);
    }

    // Switch to opponent's turn
    setCurrentTurn('opponent');

    // Bot's turn
    setTimeout(() => {
      // AI selects and plays a card
      const aiCard = getAICardSelection(opponentHand, playedCard, score.opponent, score.player);
      const newOpponentHand = opponentHand.filter(card => card.id !== aiCard.id);
      setOpponentHand(newOpponentHand);
      setLastPlayedCards({ player: playedCard, opponent: aiCard });

      // Draw new card for opponent if available
      if (opponentDeck.length > 0) {
        const { drawn, remaining } = drawCards(opponentDeck, 1);
        setOpponentHand([...newOpponentHand, ...drawn]);
        setOpponentDeck(remaining);
      }

      // Calculate round result
      const playerPower = playedCard.forca + playedCard.poder;
      const opponentPower = aiCard.forca + aiCard.poder;
      
      if (playerPower > opponentPower) {
        setScore(prev => ({ ...prev, player: prev.player + 1 }));
      } else if (opponentPower > playerPower) {
        setScore(prev => ({ ...prev, opponent: prev.opponent + 1 }));
      }

      // Clear played cards and switch turn back to player after delay
      setTimeout(() => {
        setLastPlayedCards(undefined);
        setCurrentTurn('player');
      }, 2000);
    }, 1000);
  };

  // Check for game over conditions
  useEffect(() => {
    const checkGameOver = () => {
      // Don't check for game over while in lobby or during distribution
      if (showLobby || isDistributing) return;

      // Check if either player has reached winning score
      if (score.player >= WINNING_SCORE || score.opponent >= WINNING_SCORE) {
        setWinner(score.player > score.opponent ? 'player' : 'opponent');
        setShowGameOver(true);
        return;
      }

      // Check if both players are out of cards
      if (playerHand.length === 0 && opponentHand.length === 0 && 
          playerDeck.length === 0 && opponentDeck.length === 0) {
        setWinner(score.player > score.opponent ? 'player' : 
                 score.opponent > score.player ? 'opponent' : 'draw');
        setShowGameOver(true);
      }
    };

    checkGameOver();
  }, [score, playerHand.length, opponentHand.length, playerDeck.length, opponentDeck.length, showLobby, isDistributing]);

  const handlePlayAgain = async () => {
    setShowGameOver(false);
    setWinner(undefined);
    setShowLobby(true);
  };

  const handleQuit = () => {
    setShowGameOver(false);
    on_close?.();
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      {showLobby ? (
        <PreBattleLobby
          onBattleStart={handleBattleStart}
          onCancel={on_close || (() => {})}
        />
      ) : isDistributing ? (
        <CardDistribution
          playerHand={playerHand}
          opponentHand={opponentHand}
          onComplete={handleDistributionComplete}
        />
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          <BattleArena
            playerHand={playerHand}
            opponentHand={opponentHand}
            onCardPlay={handleCardPlay}
            score={score}
            currentTurn={currentTurn}
            lastPlayedCards={lastPlayedCards}
          />
        </Box>
      )}

      {/* Game Over Dialog */}
      <Dialog
        open={showGameOver}
        onClose={handleQuit}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            borderRadius: 2,
            p: 4,
            minWidth: 300
          }
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" color="primary" gutterBottom>
            Game Over!
          </Typography>
          <Typography variant="h5" color="text.primary" sx={{ mb: 3 }}>
            {winner === 'player' ? 'You Won!' :
             winner === 'opponent' ? 'Opponent Won!' :
             'It\'s a Draw!'}
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Final Score
          </Typography>
          <Typography variant="h5" sx={{ mb: 4 }}>
            {score.player} - {score.opponent}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handlePlayAgain}
            >
              Play Again
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleQuit}
            >
              Quit
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}