import { BattleAction, BattleCard, INITIAL_HAND_CONFIG } from '../types/battle';
import { v4 as uuidv4 } from 'uuid';

const CARD_DESCRIPTIONS: Record<BattleAction, string[]> = {
  ataque: [
    'Ataque direto que causa dano ao oponente',
    'Golpe poderoso que ignora parte da defesa',
    'Ataque rápido com chance de dano crítico'
  ],
  defesa: [
    'Bloqueia parte do dano recebido',
    'Fortalece a posição defensiva'
  ],
  contra_ataque: [
    'Reverte o ataque do oponente',
    'Reflete parte do dano recebido'
  ]
};

/**
 * Creates a complete deck of cards
 */
export const createDeck = (): BattleCard[] => {
  const deck: BattleCard[] = [];
  
  // Create cards for each type
  Object.entries(INITIAL_HAND_CONFIG.cards_per_type).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) {
      const descriptions = CARD_DESCRIPTIONS[type as BattleAction];
      deck.push({
        id: uuidv4(),
        type: type as BattleAction,
        isUsed: false,
        power: Math.floor(Math.random() * 20) + 10, // Random power between 10-30
        description: descriptions[i % descriptions.length]
      });
    }
  });

  return shuffleDeck(deck);
};

/**
 * Deals a hand of cards from the deck
 */
export const dealHand = (deck: BattleCard[]): BattleCard[] => {
  return deck.slice(0, INITIAL_HAND_CONFIG.hand_size);
};

/**
 * Shuffles a deck of cards using the Fisher-Yates algorithm
 */
export const shuffleDeck = (deck: BattleCard[]): BattleCard[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Returns a random battle action
 */
export const getRandomAction = (): BattleAction => {
  const actions: BattleAction[] = ['ataque', 'defesa', 'contra_ataque'];
  return actions[Math.floor(Math.random() * actions.length)];
};

/**
 * Determines if a card can be played
 */
export const canPlayCard = (card: BattleCard): boolean => {
  return !card.isUsed;
};

/**
 * Creates a bot's card selection based on the current game state
 */
export const getBotCardSelection = (
  availableCards: BattleCard[],
  playerHealth: number,
  botHealth: number,
  strategicWeight: number = 0.7
): BattleCard => {
  const playableCards = availableCards.filter(card => !card.isUsed);
  
  if (playableCards.length === 0) {
    throw new Error('No playable cards available');
  }

  // If random roll exceeds strategic weight, make a random choice
  if (Math.random() > strategicWeight) {
    return playableCards[Math.floor(Math.random() * playableCards.length)];
  }

  // Strategic selection based on health states
  const healthRatio = botHealth / playerHealth;

  if (healthRatio < 0.5) {
    // Bot is low on health - prioritize defense
    const defenseCard = playableCards.find(card => card.type === 'defesa');
    if (defenseCard) return defenseCard;
  } else if (healthRatio > 1.5) {
    // Bot is healthy - prioritize attack
    const attackCard = playableCards.find(card => card.type === 'ataque');
    if (attackCard) return attackCard;
  }

  // Default to random selection if no strategic choice is available
  return playableCards[Math.floor(Math.random() * playableCards.length)];
}; 