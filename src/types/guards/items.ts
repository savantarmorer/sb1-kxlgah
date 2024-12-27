import { InventoryItem } from '../items';

export function isEquippableItem(item: InventoryItem): boolean {
  return item.type === 'equipment' || item.type === 'cosmetic';
}

export function isConsumableItem(item: InventoryItem): boolean {
  return item.type === 'consumable' && item.metadata?.uses !== undefined;
} 