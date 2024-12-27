import { useState, useCallback } from 'react';
import { Card } from '../types/battle';
import { createDeck, drawCards, getAICardSelection } from '../utils/cardUtils';
import { BATTLE_CONFIG } from '../config/battleConfig';

const INITIAL_HAND_SIZE = 3;

export function useCardBattle() {
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [opponentHand, setOpponentHand] = useState<Card[]>([]);
  const [playerDeck, setPlayerDeck] = useState<Card[]>([]);
  const [opponentDeck, setOpponentDeck] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<string>();
  const [opponentSelectedCard, setOpponentSelectedCard] = useState<string>();

  const initializeDecks = useCallback(() => {
    const newPlayerDeck = createDeck();
    const newOpponentDeck = createDeck();

    const { drawn: playerInitialHand, remaining: playerRemainingDeck } = drawCards(newPlayerDeck, INITIAL_HAND_SIZE);
    const { drawn: opponentInitialHand, remaining: opponentRemainingDeck } = drawCards(newOpponentDeck, INITIAL_HAND_SIZE);

    setPlayerDeck(playerRemainingDeck);
    setOpponentDeck(opponentRemainingDeck);
    setPlayerHand(playerInitialHand);
    setOpponentHand(opponentInitialHand);
  }, []);

  const selectCard = useCallback((cardId: string) => {
    if (selectedCard) return;
    setSelectedCard(cardId);
  }, [selectedCard]);

  const selectOpponentCard = useCallback((playerCard: Card) => {
    if (opponentSelectedCard) return;
    const aiCard = getAICardSelection(opponentHand, playerCard, BATTLE_CONFIG.initial_health);
    setOpponentSelectedCard(aiCard.id);
  }, [opponentHand, opponentSelectedCard]);

  const distributeCards = useCallback(() => {
    if (playerHand.length < INITIAL_HAND_SIZE) {
      const { drawn: newPlayerCards } = drawCards(playerDeck, INITIAL_HAND_SIZE - playerHand.length);
      setPlayerHand(prev => [...prev, ...newPlayerCards]);
    }

    if (opponentHand.length < INITIAL_HAND_SIZE) {
      const { drawn: newOpponentCards } = drawCards(opponentDeck, INITIAL_HAND_SIZE - opponentHand.length);
      setOpponentHand(prev => [...prev, ...newOpponentCards]);
    }
  }, [playerHand.length, opponentHand.length, playerDeck, opponentDeck]);

  const reshuffle = useCallback(() => {
    const newPlayerDeck = createDeck();
    const newOpponentDeck = createDeck();

    const { drawn: playerInitialHand } = drawCards(newPlayerDeck, INITIAL_HAND_SIZE);
    const { drawn: opponentInitialHand } = drawCards(newOpponentDeck, INITIAL_HAND_SIZE);

    setPlayerDeck(newPlayerDeck);
    setOpponentDeck(newOpponentDeck);
    setPlayerHand(playerInitialHand);
    setOpponentHand(opponentInitialHand);
  }, []);

  const removeUsedCards = useCallback(() => {
    if (selectedCard) {
      setPlayerHand(prev => prev.filter(card => card.id !== selectedCard));
    }
    if (opponentSelectedCard) {
      setOpponentHand(prev => prev.filter(card => card.id !== opponentSelectedCard));
    }
    setSelectedCard(undefined);
    setOpponentSelectedCard(undefined);
  }, [selectedCard, opponentSelectedCard]);

  return {
    playerHand,
    opponentHand,
    playerDeck,
    opponentDeck,
    selectedCard,
    opponentSelectedCard,
    initializeDecks,
    selectCard,
    selectOpponentCard,
    distributeCards,
    reshuffle,
    removeUsedCards
  };
} 