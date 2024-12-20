import { InventoryItem, GameItem, TransactionType } from '../types/items';

export interface InventoryState {
  items: InventoryItem[];
  activeEffects: {
    type: string;
    value: number;
    expiresAt?: Date;
  }[];
}

export type InventoryAction =
  | { type: 'ADD_ITEM'; payload: { item: GameItem; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { item_id: string; quantity: number } }
  | { type: 'UPDATE_ITEM'; payload: { item_id: string; updates: Partial<InventoryItem> } }
  | { type: 'EQUIP_ITEM'; payload: { item_id: string } }
  | { type: 'UNEQUIP_ITEM'; payload: { item_id: string } }
  | { type: 'ADD_EFFECT'; payload: { type: string; value: number; duration?: number } }
  | { type: 'REMOVE_EFFECT'; payload: { type: string } }
  | { type: 'CLEAR_EXPIRED_EFFECTS' };

export const initialInventoryState: InventoryState = {
  items: [],
  activeEffects: []
};

export function inventoryReducer(
  state: InventoryState,
  action: InventoryAction
): InventoryState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item, quantity } = action.payload;
      const existingItem = state.items.find(i => i.itemId === item.id);

      if (existingItem) {
        return {
          ...state,
          items: state.items.map(i =>
            i.itemId === item.id
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )
        };
      }

      return {
        ...state,
        items: [...state.items, {
          id: crypto.randomUUID(),
          itemId: item.id,
          name: item.name,
          description: item.description,
          type: item.type,
          rarity: item.rarity,
          quantity,
          equipped: false,
          imageUrl: item.imageUrl || '',
          effects: item.effects || []
        }]
      };
    }

    case 'REMOVE_ITEM': {
      const { item_id, quantity } = action.payload;
      const existingItem = state.items.find(i => i.itemId === item_id);

      if (!existingItem) {
        return state;
      }

      const newQuantity = existingItem.quantity - quantity;

      if (newQuantity <= 0) {
        return {
          ...state,
          items: state.items.filter(i => i.itemId !== item_id)
        };
      }

      return {
        ...state,
        items: state.items.map(i =>
          i.itemId === item_id
            ? { ...i, quantity: newQuantity }
            : i
        )
      };
    }

    case 'UPDATE_ITEM': {
      const { item_id, updates } = action.payload;
      return {
        ...state,
        items: state.items.map(i =>
          i.itemId === item_id
            ? { ...i, ...updates }
            : i
        )
      };
    }

    case 'EQUIP_ITEM': {
      const { item_id } = action.payload;
      return {
        ...state,
        items: state.items.map(i =>
          i.itemId === item_id
            ? { ...i, equipped: true, lastUsed: new Date() }
            : i
        )
      };
    }

    case 'UNEQUIP_ITEM': {
      const { item_id } = action.payload;
      return {
        ...state,
        items: state.items.map(i =>
          i.itemId === item_id
            ? { ...i, equipped: false }
            : i
        )
      };
    }

    case 'ADD_EFFECT': {
      const { type, value, duration } = action.payload;
      const expiresAt = duration ? new Date(Date.now() + duration * 1000) : undefined;

      return {
        ...state,
        activeEffects: [
          ...state.activeEffects,
          { type, value, expiresAt }
        ]
      };
    }

    case 'REMOVE_EFFECT': {
      const { type } = action.payload;
      return {
        ...state,
        activeEffects: state.activeEffects.filter(e => e.type !== type)
      };
    }

    case 'CLEAR_EXPIRED_EFFECTS': {
      const now = new Date();
      return {
        ...state,
        activeEffects: state.activeEffects.filter(effect => 
          !effect.expiresAt || effect.expiresAt > now
        )
      };
    }

    default:
      return state;
  }
}
