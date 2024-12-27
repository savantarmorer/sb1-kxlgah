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
  { id: 'atk4', action: 'attack', power: 6, effect: 'Draw a card if this deals damage' },
  
  // Defense cards
  { id: 'def1', action: 'defense', power: 2 },
  { id: 'def2', action: 'defense', power: 3 },
  { id: 'def3', action: 'defense', power: 4 },
  { id: 'def4', action: 'defense', power: 5, effect: 'Heal 1 HP if you block damage' },
  
  // Counter cards
  { id: 'cnt1', action: 'counter', power: 2 },
  { id: 'cnt2', action: 'counter', power: 3 },
  { id: 'cnt3', action: 'counter', power: 4 },
  { id: 'cnt4', action: 'counter', power: 5, effect: 'Deal 2 extra damage if successful' },
  
  // Special cards
  { id: 'spc1', action: 'special', power: 4, effect: 'Draw 2 cards' },
  { id: 'spc2', action: 'special', power: 3, effect: 'Heal 2 HP' },
  { id: 'spc3', action: 'special', power: 5, effect: 'Next card gets +2 power' }
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
export function drawCards(deck: Card[], count: number): Card[] {
  const drawn = deck.slice(0, count);
  return drawn;
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
  aiHand: Card[],
  lastPlayerCard?: Card,
  aiHealth: number = 10
): Card {
  if (aiHand.length === 0) return BASE_DECK[0]; // Fallback to prevent errors

  // If AI is low on health, prioritize defense
  if (aiHealth <= 3) {
    const defenseCard = aiHand.find(card => card.action === 'defense');
    if (defenseCard) return defenseCard;
  }

  // If we know the player's last card, try to counter it
  if (lastPlayerCard) {
    switch (lastPlayerCard.action) {
      case 'attack':
        const counterCard = aiHand.find(card => 
          card.action === 'counter' && card.power >= lastPlayerCard.power
        );
        if (counterCard) return counterCard;
        break;
      case 'special':
        const defenseCard = aiHand.find(card => card.action === 'defense');
        if (defenseCard) return defenseCard;
        break;
    }
  }

  // Otherwise, pick the highest power card
  return aiHand.reduce((highest, current) => 
    current.power > highest.power ? current : highest
  , aiHand[0]);
} 