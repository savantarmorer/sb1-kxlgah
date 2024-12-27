import { renderHook, act } from '@testing-library/react-hooks';
import { useCardBattle } from '../useCardBattle';
import { GameProvider } from '../../contexts/GameContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { Card } from '../../types/battle';
import React from 'react';

// Mock data
const mockPlayerCards: Card[] = [
  {
    id: '1',
    action: 'attack',
    power: 10,
    effect: null
  },
  {
    id: '2',
    action: 'defense',
    power: 8,
    effect: null
  },
  {
    id: '3',
    action: 'counter',
    power: 12,
    effect: null
  }
];

const mockOpponentCards: Card[] = [
  {
    id: '4',
    action: 'attack',
    power: 9,
    effect: null
  },
  {
    id: '5',
    action: 'defense',
    power: 7,
    effect: null
  },
  {
    id: '6',
    action: 'counter',
    power: 11,
    effect: null
  }
];

const wrapper = ({ children }) => (
  React.createElement(NotificationProvider, null,
    React.createElement(GameProvider, null, children)
  )
);

describe('useCardBattle Hook', () => {
  it('initializes deck and hands correctly', () => {
    const { result } = renderHook(() => useCardBattle(), { wrapper });

    act(() => {
      result.current.initializeDecks();
    });

    expect(result.current.playerHand).toHaveLength(3);
    expect(result.current.opponentHand).toHaveLength(3);
  });

  it('handles card selection correctly', () => {
    const { result } = renderHook(() => useCardBattle(), { wrapper });

    act(() => {
      result.current.selectCard(mockPlayerCards[0].id);
    });

    expect(result.current.selectedCard).toBe(mockPlayerCards[0].id);
  });

  it('handles AI opponent card selection correctly', () => {
    const { result } = renderHook(() => useCardBattle(), { wrapper });

    act(() => {
      result.current.initializeDecks();
      const playerCard = result.current.playerHand[0];
      result.current.selectOpponentCard(playerCard);
    });

    expect(result.current.opponentSelectedCard).toBeDefined();
  });

  it('handles card distribution correctly', () => {
    const { result } = renderHook(() => useCardBattle(), { wrapper });

    act(() => {
      result.current.initializeDecks();
      result.current.distributeCards();
    });

    expect(result.current.playerHand).toHaveLength(3);
    expect(result.current.opponentHand).toHaveLength(3);
  });

  it('handles reshuffling when out of cards', () => {
    const { result } = renderHook(() => useCardBattle(), { wrapper });

    act(() => {
      result.current.initializeDecks();
      result.current.reshuffle();
    });

    expect(result.current.playerHand).toHaveLength(3);
    expect(result.current.opponentHand).toHaveLength(3);
    expect(result.current.playerDeck.length).toBeGreaterThan(0);
    expect(result.current.opponentDeck.length).toBeGreaterThan(0);
  });

  it('removes used cards correctly', () => {
    const { result } = renderHook(() => useCardBattle(), { wrapper });

    act(() => {
      result.current.initializeDecks();
      const cardId = result.current.playerHand[0].id;
      result.current.selectCard(cardId);
      result.current.removeUsedCards();
    });

    expect(result.current.playerHand).toHaveLength(2);
  });
}); 