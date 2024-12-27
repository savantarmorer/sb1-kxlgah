import React, { useState, useEffect, useCallback } from 'react';
import { BattleErrorBoundary } from '../../components/Battle/BattleErrorBoundary';
import { useGame } from '../../contexts/game/gameContext';
import { useBattle } from '../../hooks/useBattle';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { Card, getAICardSelection, calculateRoundWinner } from './cardUtils';
import { BattleArena } from './BattleArena';

const BattleMode: React.FC = () => {
  const { state, dispatch } = useGame();
  const { phase, currentQuestion } = useBattle();
  const { matchmakingState, leaveQueue } = useMatchmaking();

  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [opponentHand, setOpponentHand] = useState<Card[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [currentTurn, setCurrentTurn] = useState<'player' | 'opponent'>('player');
  const [lastPlayedCards, setLastPlayedCards] = useState<{
    player: Card | null;
    opponent: Card | null;
  }>({ player: null, opponent: null });
  const [turnTimer, setTurnTimer] = useState<number>(30);
  const [isDistributing, setIsDistributing] = useState(false);

  // Initialize battle
  useEffect(() => {
    if (phase === 'PREPARING') {
      setupBattle();
    }
  }, [phase]);

  // Handle turn timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentTurn === 'player' && turnTimer > 0) {
      timer = setInterval(() => {
        setTurnTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [currentTurn, turnTimer]);

  // Auto-play when timer runs out
  useEffect(() => {
    if (turnTimer === 0 && currentTurn === 'player') {
      const randomCard = playerHand[Math.floor(Math.random() * playerHand.length)];
      handleCardPlay(randomCard);
    }
  }, [turnTimer]);

  const setupBattle = async () => {
    setIsDistributing(true);
    // Initialize with bot opponent
    const is_bot = matchmakingState.status !== 'searching';
    
    // Create and shuffle decks
    const playerDeck = createDeck();
    const opponentDeck = createDeck();
    
    // Draw initial hands
    const initialPlayerHand = playerDeck.slice(0, 5);
    const initialOpponentHand = opponentDeck.slice(0, 5);
    
    setPlayerHand(initialPlayerHand);
    setOpponentHand(initialOpponentHand);
    setPlayerScore(0);
    setOpponentScore(0);
    setCurrentTurn('player');
    setLastPlayedCards({ player: null, opponent: null });
    setTurnTimer(30);
    setIsDistributing(false);
  };

  const handleCardPlay = useCallback((card: Card) => {
    if (currentTurn !== 'player') return;

    // Update player's hand and last played card
    setPlayerHand((prev) => prev.filter((c) => c.id !== card.id));
    setLastPlayedCards((prev) => ({ ...prev, player: card }));
    setTurnTimer(30);

    // Switch to opponent's turn
    setCurrentTurn('opponent');

    // Handle AI opponent's turn
    setTimeout(() => {
      const aiCard = getAICardSelection(
        opponentHand,
        card,
        opponentScore,
        playerScore
      );

      // Update opponent's hand and last played card
      setOpponentHand((prev) => prev.filter((c) => c.id !== aiCard.id));
      setLastPlayedCards((prev) => ({ ...prev, opponent: aiCard }));

      // Calculate round winner and update scores
      const roundWinner = calculateRoundWinner(card, aiCard);
      if (roundWinner === 'player') {
        setPlayerScore((prev) => prev + 1);
      } else if (roundWinner === 'opponent') {
        setOpponentScore((prev) => prev + 1);
      }

      // Switch back to player's turn
      setCurrentTurn('player');
    }, 1000); // 1 second delay for AI "thinking"
  }, [currentTurn, opponentHand, opponentScore, playerScore]);

  const createDeck = (): Card[] => {
    // Create a deck of cards with various powers and actions
    const deck: Card[] = [];
    const actions: BattleAction[] = ['attack', 'defense', 'counter', 'special'];
    
    for (let i = 1; i <= 10; i++) {
      actions.forEach((action) => {
        deck.push({
          id: `${action}-${i}`,
          name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${i}`,
          power: i,
          action,
          description: `A ${action} card with power ${i}`
        });
      });
    }
    
    // Shuffle the deck
    return deck.sort(() => Math.random() - 0.5);
  };

  if (error) {
    return <BattleErrorBoundary message="An error occurred during the battle." />;
  }

  return (
    <div className="battle-mode">
      {isDistributing ? (
        <CardDistribution />
      ) : (
        <BattleArena
          playerHand={playerHand}
          opponentHand={opponentHand}
          onCardPlay={handleCardPlay}
          playerScore={playerScore}
          opponentScore={opponentScore}
          currentTurn={currentTurn}
          lastPlayedCards={lastPlayedCards}
          turnTimer={turnTimer}
        />
      )}
    </div>
  );
};

export default BattleMode; 