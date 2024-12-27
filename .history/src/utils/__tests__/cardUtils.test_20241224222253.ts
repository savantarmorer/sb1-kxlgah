import { createDeck, drawCards, getAICardSelection } from '../cardUtils';

describe('Card Utilities', () => {
  describe('createDeck', () => {
    it('creates a deck with correct size', () => {
      const deck = createDeck();
      expect(deck.length).toBe(7); // Total deck size
    });

    it('creates a deck with correct card distribution', () => {
      const deck = createDeck();
      
      const attackCards = deck.filter(card => card.action === 'attack');
      const defenseCards = deck.filter(card => card.action === 'defense');
      const counterCards = deck.filter(card => card.action === 'counter');

      expect(attackCards.length).toBe(3); // 3 attack cards
      expect(defenseCards.length).toBe(2); // 2 defense cards
      expect(counterCards.length).toBe(2); // 2 counter cards
    });

    it('creates cards with unique IDs', () => {
      const deck = createDeck();
      const ids = deck.map(card => card.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(deck.length);
    });

    it('creates cards with valid power values', () => {
      const deck = createDeck();
      deck.forEach(card => {
        expect(card.power).toBeGreaterThan(0);
        expect(card.power).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('drawCards', () => {
    it('draws the specified number of cards', () => {
      const deck = createDeck();
      const { drawn, remaining } = drawCards(deck, 3);
      
      expect(drawn.length).toBe(3);
      expect(remaining.length).toBe(4);
    });

    it('removes drawn cards from the deck', () => {
      const deck = createDeck();
      const { drawn, remaining } = drawCards(deck, 3);
      
      drawn.forEach(drawnCard => {
        expect(remaining.find(card => card.id === drawnCard.id)).toBeUndefined();
      });
    });

    it('handles drawing more cards than available', () => {
      const deck = createDeck();
      const { drawn, remaining } = drawCards(deck, 10);
      
      expect(drawn.length).toBe(deck.length);
      expect(remaining.length).toBe(0);
    });

    it('handles drawing from empty deck', () => {
      const { drawn, remaining } = drawCards([], 3);
      
      expect(drawn.length).toBe(0);
      expect(remaining.length).toBe(0);
    });
  });

  describe('getAICardSelection', () => {
    const mockHand = [
      { id: '1', action: 'attack', power: 10 },
      { id: '2', action: 'defense', power: 10 },
      { id: '3', action: 'counter', power: 10 }
    ];

    it('selects counter when opponent attacks with low health', () => {
      const opponentCard = { id: '4', action: 'attack', power: 10 };
      const selectedCard = getAICardSelection(mockHand, opponentCard, 20);
      
      expect(selectedCard.action).toBe('counter');
    });

    it('prefers defense with high health', () => {
      const opponentCard = { id: '4', action: 'attack', power: 10 };
      const selectedCard = getAICardSelection(mockHand, opponentCard, 40);
      
      expect(selectedCard.action).toBe('defense');
    });

    it('selects attack when opponent is defending', () => {
      const opponentCard = { id: '4', action: 'defense', power: 10 };
      const selectedCard = getAICardSelection(mockHand, opponentCard, 50);
      
      expect(selectedCard.action).toBe('attack');
    });

    it('handles empty hand', () => {
      const opponentCard = { id: '4', action: 'attack', power: 10 };
      expect(() => getAICardSelection([], opponentCard, 50)).toThrow();
    });

    it('handles missing opponent card', () => {
      const selectedCard = getAICardSelection(mockHand, null, 50);
      expect(selectedCard).toBeDefined();
    });
  });
}); 