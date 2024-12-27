import { BattleActionType, BattleActions } from '../types/battle';

export interface Card {
  id: string;
  name: string;
  forca: number;
  poder: number;
  type: 'promotoria' | 'defesa';
}

const PROMOTORIA_DECK: Card[] = [
  { id: 'p1', name: 'Denúncia Precisa', forca: 5, poder: 1, type: 'promotoria' },
  { id: 'p2', name: 'Argumentação Sólida', forca: 4, poder: 2, type: 'promotoria' },
  { id: 'p3', name: 'Evidência Concreta', forca: 3, poder: 3, type: 'promotoria' },
  { id: 'p4', name: 'Testemunha Chave', forca: 2, poder: 2, type: 'promotoria' },
  { id: 'p5', name: 'Perícia Técnica', forca: 1, poder: 3, type: 'promotoria' }
];

const DEFESA_DECK: Card[] = [
  { id: 'd1', name: 'Álibi Perfeito', forca: 5, poder: 1, type: 'defesa' },
  { id: 'd2', name: 'Contra-Argumentação', forca: 4, poder: 2, type: 'defesa' },
  { id: 'd3', name: 'Prova de Inocência', forca: 3, poder: 3, type: 'defesa' },
  { id: 'd4', name: 'Testemunha de Defesa', forca: 2, poder: 2, type: 'defesa' },
  { id: 'd5', name: 'Laudo Alternativo', forca: 1, poder: 3, type: 'defesa' }
];

export function createDeck(role: 'promotoria' | 'defesa'): Card[] {
  const deck = role === 'promotoria' ? [...PROMOTORIA_DECK] : [...DEFESA_DECK];
  return shuffle(deck);
}

export function drawCards(deck: Card[], count: number): { drawn: Card[], remaining: Card[] } {
  const drawn = deck.slice(0, count);
  const remaining = deck.slice(count);
  return { drawn, remaining };
}

export function getAICardSelection(
  hand: Card[],
  playerCard: Card,
  playerScore: number,
  opponentScore: number
): Card {
  // If winning, play conservatively
  if (opponentScore > playerScore) {
    // Find a card that can beat the player's card
    const winningCard = hand.find(card => 
      card.forca > playerCard.forca || 
      (card.forca === playerCard.forca && card.poder > playerCard.poder)
    );
    if (winningCard) return winningCard;
  }
  
  // If losing or tied, play aggressively
  const strongestCard = hand.reduce((prev, curr) => {
    if (curr.forca > prev.forca) return curr;
    if (curr.forca === prev.forca && curr.poder > prev.poder) return curr;
    return prev;
  });
  
  return strongestCard;
}

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
} 