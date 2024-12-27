import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
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

      // Initialize battle state
      dispatch({ type: 'SET_BATTLE_STATUS', payload: BattleStateEnum.CARD_SELECTION });

      // Set bot opponent
      const botOpponent = {
        id: 'bot',
        name: 'Bot Opponent',
        is_bot: true,
        difficulty: 'medium'
      };
      dispatch({ type: 'SET_OPPONENT', payload: botOpponent });

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
      handleCardSelect(cardId);
    }
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
    </Box>
  );
}