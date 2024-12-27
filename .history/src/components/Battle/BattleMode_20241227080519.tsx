import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useGame } from '../../contexts/GameContext';
import { BattleStateEnum } from '../../types/battle';
import { useBattle } from '../../hooks/useBattle';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { CardDistribution } from './CardDistribution';
import { BattleArena } from './BattleArena';
import { createDeck, drawCards, getAICardSelection } from '../../utils/cardUtils';
import type { Card } from '../../utils/cardUtils';

interface BattleModeProps {
  on_close?: () => void;
}

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

  const [isDistributing, setIsDistributing] = useState(true);
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

  // Initialize battle and connect to matchmaking
  useEffect(() => {
    const setupBattle = async () => {
      try {
        // Initialize local battle state
        await initializeBattle({
          is_bot: matchmakingState.status !== 'searching',
          difficulty: 'medium'
        });

        // Create and shuffle decks
        const pDeck = createDeck('promotoria');
        const oDeck = createDeck('defesa');
        
        // Draw initial hands
        const { drawn: pHand, remaining: pRemaining } = drawCards(pDeck, 5);
        const { drawn: oHand, remaining: oRemaining } = drawCards(oDeck, 5);

        setPlayerDeck(pRemaining);
        setOpponentDeck(oRemaining);
        setPlayerHand(pHand);
        setOpponentHand(oHand);

        // Join matchmaking queue if not playing against bot
        if (!opponent?.is_bot) {
          await joinQueue({
            mode: 'casual',
            difficulty: 'medium'
          });
        }
      } catch (error) {
        console.error('Failed to setup battle:', error);
        on_close?.();
      }
    };

    setupBattle();

    // Cleanup on unmount
    return () => {
      if (gameState.user?.id) {
        leaveQueue();
      }
    };
  }, [gameState.user?.id, initializeBattle, joinQueue, leaveQueue, opponent]);

  const handleDistributionComplete = () => {
    setIsDistributing(false);
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

    if (opponent?.is_bot) {
      // AI opponent's turn
      setCurrentTurn('opponent');
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

        // Clear played cards and switch turn back to player
        setTimeout(() => {
          setLastPlayedCards(undefined);
          setCurrentTurn('player');
        }, 2000);
      }, 1000);
    } else {
      // Send move to opponent through matchmaking
      // TODO: Implement multiplayer card play
    }
  };

  return (
    <Box sx={{ height: '100%', bgcolor: 'background.paper' }}>
      {isDistributing ? (
        <CardDistribution
          playerHand={playerHand}
          opponentHand={opponentHand}
          onComplete={handleDistributionComplete}
        />
      ) : (
        <BattleArena
          playerHand={playerHand}
          opponentHand={opponentHand}
          onCardPlay={handleCardPlay}
          score={score}
          currentTurn={currentTurn}
          lastPlayedCards={lastPlayedCards}
        />
      )}
    </Box>
  );
}