import { BattleActionType, BattleActions } from '../types/battle';

export interface Card {
  id: string;
  name: string;
  forca: number; // Strength (1-5)
  poder: number; // Power (1-3)
  type: 'promotoria' | 'defesa';
}

// Promotoria deck
const PROMOTORIA_DECK: Card[] = [
  { id: 'p1', name: 'Denúncia', forca: 1, poder: 3, type: 'promotoria' },
  { id: 'p2', name: 'Testemunha', forca: 2, poder: 2, type: 'promotoria' },
  { id: 'p3', name: 'Perícia', forca: 3, poder: 1, type: 'promotoria' },
  { id: 'p4', name: 'Escuta', forca: 4, poder: 2, type: 'promotoria' },
  { id: 'p5', name: 'Flagrante', forca: 5, poder: 1, type: 'promotoria' }
];

// Defesa deck
const DEFESA_DECK: Card[] = [
  { id: 'd1', name: 'Habeas Corpus', forca: 1, poder: 2, type: 'defesa' },
  { id: 'd2', name: 'Álibi', forca: 2, poder: 3, type: 'defesa' },
  { id: 'd3', name: 'Contradição', forca: 3, poder: 2, type: 'defesa' },
  { id: 'd4', name: 'Nulidade', forca: 4, poder: 1, type: 'defesa' },
  { id: 'd5', name: 'Absolvição', forca: 5, poder: 2, type: 'defesa' }
];

// Shuffle an array using Fisher-Yates algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Create a new deck for a player based on their role
export function createDeck(role: 'promotoria' | 'defesa'): Card[] {
  return shuffleArray(role === 'promotoria' ? PROMOTORIA_DECK : DEFESA_DECK);
}

// Draw a specific number of cards from the deck
export interface DrawResult {
  drawn: Card[];
  remaining: Card[];
}

export function drawCards(deck: Card[], count: number): DrawResult {
  const drawn = deck.slice(0, count);
  const remaining = deck.slice(count);
  return { drawn, remaining };
}

// Calculate battle result between two cards
export function calculateBattleResult(card1: Card, card2: Card): { winner: Card | null, points: number } {
  if (card1.forca > card2.forca) {
    return { winner: card1, points: 1 };
  } else if (card2.forca > card1.forca) {
    return { winner: card2, points: 1 };
  } else {
    // If força is equal, compare poder
    if (card1.poder > card2.poder) {
      return { winner: card1, points: 1 };
    } else if (card2.poder > card1.poder) {
      return { winner: card2, points: 1 };
    }
  }
  // If both força and poder are equal, it's a draw
  return { winner: null, points: 0 };
}

// Get AI opponent's card selection
export function getAICardSelection(
  hand: Card[],
  opponentCard: Card | null,
  playerScore: number,
  opponentScore: number
): Card {
  if (hand.length === 0) {
    throw new Error('Cannot select card from empty hand');
  }

  // If opponent hasn't played a card yet
  if (!opponentCard) {
    // If AI is winning, play conservatively
    if (opponentScore > playerScore) {
      // Find cards with lowest força
      const lowestForca = Math.min(...hand.map(c => c.forca));
      const weakCards = hand.filter(c => c.forca === lowestForca);
      return weakCards[Math.floor(Math.random() * weakCards.length)];
    }
    
    // If AI is losing or tied, play aggressively
    const highestForca = Math.max(...hand.map(c => c.forca));
    const strongCards = hand.filter(c => c.forca === highestForca);
    return strongCards[Math.floor(Math.random() * strongCards.length)];
  }

  // If opponent has played a card
  // Find cards that can beat opponent's força
  const winningCards = hand.filter(c => c.forca > opponentCard.forca);
  
  if (winningCards.length > 0) {
    // Play the lowest winning força to conserve stronger cards
    const lowestWinningForca = Math.min(...winningCards.map(c => c.forca));
    const bestCards = winningCards.filter(c => c.forca === lowestWinningForca);
    return bestCards[Math.floor(Math.random() * bestCards.length)];
  }

  // If we can't win with força, try to win with poder
  const equalForcaCards = hand.filter(c => c.forca === opponentCard.forca);
  if (equalForcaCards.length > 0) {
    const winningPoderCards = equalForcaCards.filter(c => c.poder > opponentCard.poder);
    if (winningPoderCards.length > 0) {
      return winningPoderCards[Math.floor(Math.random() * winningPoderCards.length)];
    }
  }

  // If we can't win, minimize losses by playing our weakest card
  const lowestForca = Math.min(...hand.map(c => c.forca));
  const weakestCards = hand.filter(c => c.forca === lowestForca);
  return weakestCards[Math.floor(Math.random() * weakestCards.length)];
} 