import { useContext, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import { GameItem, InventoryItem, ItemEffect } from '../types/items';

export function useInventory() {
  const { state, dispatch } = useGame();

  const handleItemTransaction = useCallback(async (
    item: GameItem,
    quantity: number,
    type: 'purchase' | 'use' | 'sell',
    price: number
  ) => {
    if (!state.user) return;
    
    dispatch({
      type: 'UPDATE_INVENTORY',
      payload: {
        items: type === 'purchase'
          ? [...(state.inventory?.items || []), {
              id: item.id,
              name: item.name,
              description: item.description,
              type: item.type,
              rarity: item.rarity,
              equipped: false,
              quantity,
              imageUrl: item.imageUrl,
              effects: item.effects,
              is_active: true,
              acquired_at: new Date().toISOString()
            }]
          : (state.inventory?.items || []).map(i => 
              i.id === item.id 
                ? { ...i, quantity: type === 'sell' ? i.quantity - quantity : i.quantity }
                : i
            ).filter(i => i.quantity > 0)
      }
    });

    if (type === 'purchase') {
      dispatch({ type: 'ADD_COINS', payload: { amount: -price, source: 'purchase' } });
    } else if (type === 'sell') {
      dispatch({ type: 'ADD_COINS', payload: { amount: price, source: 'sell' } });
    }
  }, [state.user, dispatch]);

  const addItem = useCallback(async (item: GameItem, quantity: number, price: number) => {
    await handleItemTransaction(item, quantity, 'purchase', price);
  }, [handleItemTransaction]);

  const removeItem = useCallback(async (item: GameItem, quantity: number) => {
    await handleItemTransaction(item, quantity, 'use', 0);
  }, [handleItemTransaction]);

  const sellItem = useCallback(async (item: GameItem, quantity: number, price: number) => {
    await handleItemTransaction(item, quantity, 'sell', price);
  }, [handleItemTransaction]);

  const equipItem = useCallback(async (item: GameItem) => {
    dispatch({
      type: 'UPDATE_INVENTORY',
      payload: {
        items: state.inventory.items.map(invItem =>
          invItem.id === item.id
            ? { ...invItem, equipped: true, last_used: new Date().toISOString() }
            : invItem
        )
      }
    });
  }, [dispatch, state.inventory?.items]);

  const unequipItem = useCallback(async (item: GameItem) => {
    dispatch({
      type: 'UPDATE_INVENTORY',
      payload: {
        items: state.inventory.items.map(i =>
          i.id === item.id
            ? { ...i, equipped: false }
            : i
        )
      }
    });
  }, [dispatch, state.inventory?.items]);

  const useItem = useCallback(async (item: GameItem) => {
    await handleItemTransaction(item, 1, 'use', 0);
  }, [handleItemTransaction]);

  const getInventoryItem = useCallback((item_id: string): InventoryItem | undefined => {
    return state.user?.user_inventory?.find(i => i.id === item_id);
  }, [state.user?.user_inventory]);

  const getActiveEffects = useCallback((): ItemEffect[] => {
    return state.activeEffects;
  }, [state.activeEffects]);

  const hasActiveEffect = useCallback((effectType: string): boolean => {
    return state.activeEffects.some(effect => 
      effect.type === effectType && (!effect.expiresAt || new Date(effect.expiresAt) > new Date())
    );
  }, [state.activeEffects]);

  const getEffectValue = useCallback((effectType: string): number => {
    const effect = state.activeEffects.find(e => 
      e.type === effectType && (!e.expiresAt || new Date(e.expiresAt) > new Date())
    );
    return effect?.value || 0;
  }, [state.activeEffects]);

  return {
    inventory: state.user?.user_inventory || [],
    activeEffects: state.activeEffects || [],
    addItem,
    removeItem,
    sellItem,
    equipItem,
    unequipItem,
    useItem,
    getInventoryItem,
    getActiveEffects,
    hasActiveEffect,
    getEffectValue
  };
}
