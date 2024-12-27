export type BattleAction = 'attack' | 'defense' | 'counter' | 'special';

export interface Card {
  id: string;
  name: string;
  power: number;
  action: BattleAction;
  description: string;
}

export const getAICardSelection = (
  opponentHand: Card[],
  lastPlayedCard: Card | null,
  opponentScore: number,
  playerScore: number
): Card => {
  // If no cards in hand, throw error
  if (opponentHand.length === 0) {
    throw new Error('No cards in opponent hand');
  }

  // If this is the first play (no last played card)
  if (!lastPlayedCard) {
    // Play a random card with preference for lower power cards
    const sortedByPower = [...opponentHand].sort((a, b) => a.power - b.power);
    const lowPowerCards = sortedByPower.slice(0, Math.ceil(sortedByPower.length / 2));
    return lowPowerCards[Math.floor(Math.random() * lowPowerCards.length)];
  }

  // If opponent is winning, play defensively
  if (opponentScore > playerScore) {
    // Look for counter or defense cards
    const defensiveCards = opponentHand.filter(
      card => card.action === 'defense' || card.action === 'counter'
    );
    if (defensiveCards.length > 0) {
      return defensiveCards[Math.floor(Math.random() * defensiveCards.length)];
    }
  }

  // If opponent is losing or tied, try to play aggressively
  // Look for cards that can beat the last played card
  const winningCards = opponentHand.filter(card => card.power > lastPlayedCard.power);
  if (winningCards.length > 0) {
    // Play the lowest power card that can still win
    return winningCards.sort((a, b) => a.power - b.power)[0];
  }

  // If no winning cards available, play the highest power card
  return [...opponentHand].sort((a, b) => b.power - a.power)[0];
};

export const calculateRoundWinner = (
  playerCard: Card,
  opponentCard: Card
): 'player' | 'opponent' | 'draw' => {
  // Special action rules
  if (playerCard.action === 'counter' && opponentCard.action === 'attack') {
    return 'player';
  }
  if (opponentCard.action === 'counter' && playerCard.action === 'attack') {
    return 'opponent';
  }
  if (playerCard.action === 'defense' && opponentCard.action === 'attack') {
    return playerCard.power >= opponentCard.power ? 'player' : 'opponent';
  }
  if (opponentCard.action === 'defense' && playerCard.action === 'attack') {
    return opponentCard.power >= playerCard.power ? 'opponent' : 'player';
  }

  // Default power comparison
  if (playerCard.power > opponentCard.power) {
    return 'player';
  }
  if (opponentCard.power > playerCard.power) {
    return 'opponent';
  }
  return 'draw';
}; 