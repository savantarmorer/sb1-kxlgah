import { ItemEffect, ItemEffectType, ItemType } from '../types/items';
import type { InventoryItem } from '../types/items';
import React from 'react';

export const EFFECT_COMBINATIONS: Record<ItemEffectType, string[]> = {
  'xp_boost': ['coin_boost', 'quest_boost'],
  'coin_boost': ['xp_boost', 'battle_boost'],
  'battle_boost': ['coin_boost'],
  'quest_boost': ['xp_boost'],
  'streak_protection': [],
  'instant_xp': [],
  'instant_coins': [],
  'unlock_content': []
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
  }

  // Apply rarity multipliers if needed
  // Apply duration-based scaling if needed
  // Apply combination bonuses if needed

  return baseValue * multiplier;
};

export const validateEffectCombination = (
  currentEffects: ItemEffect[],
  newEffect: ItemEffect
): boolean => {
  // Check if this effect type can be combined with existing effects
  const allowedCombinations = EFFECT_COMBINATIONS[newEffect.type] || [];
  const existingTypes = currentEffects.map(e => e.type);

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
    // Add other effect type previews
  }

  return previews;
};

const calculatePotentialGain = (effect: ItemEffect): number => {
  // Add logic to calculate potential gains based on effect type
  return 0;
};

export function getItemIcon(item: InventoryItem): JSX.Element {
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    target.src = Array.isArray(item.effects) 
      ? item.effects.find(effect => effect.metadata?.icon)?.metadata?.icon || '🧪'
      : '🧪';
  };

  return (
    <img 
      src={item.imageUrl || `/images/items/${item.id}.png`}
      alt={item.name}
      style={{ width: 28, height: 28 }}
      onError={handleError}
    />
  );
} 