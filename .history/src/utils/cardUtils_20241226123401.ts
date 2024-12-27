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

// Create a new deck for a player based on their role
export function createDeck(role: 'promotoria' | 'defesa'): Card[] {
  return shuffleArray(role === 'promotoria' ? PROMOTORIA_DECK : DEFESA_DECK);
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

// Shuffle an array using Fisher-Yates algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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

// Calculate damage based on card interactions
export function calculateDamage(
  attackerCard: Card,
  defenderCard: Card
): { damage: number; effects: string[] } {
  const effects: string[] = [];
  let damage = 0;

  // Basic damage calculation based on card types
  switch (attackerCard.action) {
    case 'attack':
      if (defenderCard.action === 'defense') {
        damage = Math.max(0, attackerCard.power - defenderCard.power);
      } else if (defenderCard.action === 'counter') {
        damage = defenderCard.power > attackerCard.power ? 0 : attackerCard.power;
        if (defenderCard.power > attackerCard.power) {
          effects.push('Counter successful! Dealing counter damage.');
        }
      } else {
        damage = attackerCard.power;
      }
      break;

    case 'counter':
      if (defenderCard.action === 'attack') {
        damage = attackerCard.power > defenderCard.power ? attackerCard.power : 0;
        if (attackerCard.power > defenderCard.power) {
          effects.push('Counter successful!');
        }
      }
      break;

    case 'special':
      damage = attackerCard.power;
      if (attackerCard.effect) {
        effects.push(attackerCard.effect);
      }
      break;
  }

  // Add card-specific effects
  if (attackerCard.effect) {
    effects.push(attackerCard.effect);
  }
  if (defenderCard.effect) {
    effects.push(defenderCard.effect);
  }

  return { damage, effects };
}

// Get AI opponent's card selection
export function getAICardSelection(
  hand: Card[],
  opponentCard: Card | null,
  currentHealth: number
): Card {
  if (hand.length === 0) {
    throw new Error('Cannot select card from empty hand');
  }

  // If opponent hasn't selected a card yet, choose randomly
  if (!opponentCard) {
    return hand[Math.floor(Math.random() * hand.length)];
  }

  // Get available cards by type
  const attackCards = hand.filter(card => card.action === BattleActions.ATTACK);
  const defenseCards = hand.filter(card => card.action === BattleActions.DEFENSE);
  const counterCards = hand.filter(card => card.action === BattleActions.COUNTER);

  // Low health strategy (below 40% health)
  if (currentHealth <= 20) {
    // Prefer counter if opponent is attacking
    if (opponentCard.action === BattleActions.ATTACK && counterCards.length > 0) {
      return counterCards[0];
    }
    // Otherwise prefer attack to end the game quickly
    if (attackCards.length > 0) {
      return attackCards[0];
    }
  }

  // High health strategy (above 40% health)
  if (currentHealth > 20) {
    // Prefer defense against attacks
    if (opponentCard.action === BattleActions.ATTACK && defenseCards.length > 0) {
      return defenseCards[0];
    }
    // Use counter if available against attacks
    if (opponentCard.action === BattleActions.ATTACK && counterCards.length > 0) {
      return counterCards[0];
    }
  }

  // Default strategies
  if (opponentCard.action === BattleActions.DEFENSE && attackCards.length > 0) {
    // Attack against defense
    return attackCards[0];
  }
  if (defenseCards.length > 0) {
    // Default to defense if available
    return defenseCards[0];
  }

  // If no specific strategy applies, return first available card
  return hand[0];
} 