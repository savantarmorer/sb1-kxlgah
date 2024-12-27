import { BattleAction, BattleCard, INITIAL_HAND_CONFIG } from '../types/battle';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a new deck of cards based on the initial configuration
 */
export const createDeck = (): BattleCard[] => {
  const deck: BattleCard[] = [];

  // Add regular cards
  Object.entries(INITIAL_HAND_CONFIG).forEach(([type, count]) => {
    if (type === 'wildcard') return; // Handle wildcards separately

    for (let i = 0; i < count; i++) {
      deck.push({
        id: uuidv4(),
        type: type as BattleAction,
        isWildcard: false,
        isUsed: false
      });
    }
  });

  // Add wildcard
  const wildcardType = getRandomAction();
  deck.push({
    id: uuidv4(),
    type: wildcardType,
    isWildcard: true,
    isUsed: false
  });

  return shuffleDeck(deck);
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

/**
 * Calculates bonus effects for wildcard usage
 */
export const calculateWildcardBonus = (
  baseValue: number,
  bonusMultiplier: number
): number => {
  return Math.round(baseValue * bonusMultiplier);
}; 