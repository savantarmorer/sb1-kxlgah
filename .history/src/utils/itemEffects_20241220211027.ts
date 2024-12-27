import { ItemEffect, ItemEffectType, ItemType } from '../types/items';

export const EFFECT_COMBINATIONS: Record<ItemEffectType, string[]> = {
  'xp_boost': ['coin_boost', 'quest_boost'],
  'coin_boost': ['xp_boost', 'battle_boost'],
  'battle_boost': ['coin_boost'],
  'quest_boost': ['xp_boost'],
  'streak_protection': [],
  'instant_xp': [],
  'instant_coins': [],
  'unlock_content': [],
  'eliminate_wrong_answer': ['battle_boost']
};

export const calculateEffectValue = (effect: ItemEffect, itemType: ItemType): number => {
  const baseValue = effect.value;
  let multiplier = 1;

  // Apply type-specific multipliers
  switch (itemType) {
    case ItemType.EQUIPMENT:
      multiplier *= 1.5; // Equipment effects are 50% stronger
      break;
    case ItemType.BOOSTER:
      if (effect.type.includes('boost')) {
        multiplier *= 2; // Boosters have double effect for boost types
      }
      break;
    case ItemType.CONSUMABLE:
      if (effect.type === 'eliminate_wrong_answer') {
        // No multiplier for elimination effects
        return Math.min(baseValue, 2); // Maximum 2 wrong answers can be eliminated
      }
      break;
  }

  return baseValue * multiplier;
};

export const validateEffectCombination = (
  currentEffects: ItemEffect[],
  newEffect: ItemEffect
): boolean => {
  // Check if this effect type can be combined with existing effects
  const allowedCombinations = EFFECT_COMBINATIONS[newEffect.type] || [];
  const existingTypes = currentEffects.map(e => e.type);

  // Special validation for eliminate_wrong_answer
  if (newEffect.type === 'eliminate_wrong_answer') {
    // Only allow one elimination effect per item
    if (existingTypes.includes('eliminate_wrong_answer')) {
      return false;
    }
    // Value must be between 1 and 2
    if (newEffect.value < 1 || newEffect.value > 2) {
      return false;
    }
  }

  return existingTypes.every(type => allowedCombinations.includes(type));
};

export const previewEffectApplication = (effect: ItemEffect): string[] => {
  const previews: string[] = [];

  switch (effect.type) {
    case 'xp_boost':
      previews.push(
        `Increases XP gain by ${effect.metadata?.boost_percentage}%`,
        `Duration: ${effect.duration! / 3600} hours`,
        `Potential XP gain: +${calculatePotentialGain(effect)}XP`
      );
      break;
    case 'eliminate_wrong_answer':
      previews.push(
        `Eliminates ${effect.value} wrong answer${effect.value > 1 ? 's' : ''}`,
        'Can be used during battle',
        'Single use'
      );
      break;
    // Add other effect type previews
  }

  return previews;
};

const calculatePotentialGain = (effect: ItemEffect): number => {
  // Add logic to calculate potential gains based on effect type
  return 0;
}; 