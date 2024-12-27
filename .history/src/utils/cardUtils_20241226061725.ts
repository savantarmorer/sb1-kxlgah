import type { BattleAction } from '../types/battle';

export interface Card {
  id: string;
  action: BattleAction;
  power: number;
  effect?: string;
}

// Base deck configuration
const BASE_DECK: Card[] = [
  // Attack cards
  { id: 'atk1', action: 'attack', power: 3 },
  { id: 'atk2', action: 'attack', power: 4 },
  { id: 'atk3', action: 'attack', power: 5 },
  
  // Defense cards
  { id: 'def1', action: 'defense', power: 3 },
  { id: 'def2', action: 'defense', power: 4 },
  
  // Counter cards
  { id: 'cnt1', action: 'counter', power: 3 },
  { id: 'cnt2', action: 'counter', power: 4 }
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

// Create a new shuffled deck
export function createDeck(): Card[] {
  return shuffleArray(BASE_DECK);
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
  const attackCards = hand.filter(card => card.action === 'attack');
  const defenseCards = hand.filter(card => card.action === 'defense');
  const counterCards = hand.filter(card => card.action === 'counter');

  // Low health strategy (below 40% health)
  if (currentHealth <= 20) {
    // Prefer counter if opponent is attacking
    if (opponentCard.action === 'attack' && counterCards.length > 0) {
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
    if (opponentCard.action === 'attack' && defenseCards.length > 0) {
      return defenseCards[0];
    }
    // Use counter if available against attacks
    if (opponentCard.action === 'attack' && counterCards.length > 0) {
      return counterCards[0];
    }
  }

  // Default strategies
  if (opponentCard.action === 'defense' && attackCards.length > 0) {
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

export type BattleAction = 'ATTACK' | 'DEFENSE' | 'COUNTER' | 'SPECIAL';

// Optionally, use enum for better type safety
export enum BattleActionEnum {
  ATTACK = 'ATTACK',
  DEFENSE = 'DEFENSE',
  COUNTER = 'COUNTER',
  SPECIAL = 'SPECIAL'
} 