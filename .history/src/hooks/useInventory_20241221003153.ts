import { useContext, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import { GameItem, InventoryItem, ItemEffect } from '../types/items';

export function useInventory() {
  const { state, dispatch } = useGame();

  const handleItemTransaction = useCallback(async (
    item: GameItem | InventoryItem,
    quantity: number,
    type: 'purchase' | 'use' | 'sell',
    price: number
  ) => {
    if (!state.inventory) return;
    
    // Transform effects to include battle_only metadata
    const transformedEffects = Array.isArray(item.effects) 
      ? item.effects.map(effect => ({
          ...effect,
          metadata: {
            ...effect.metadata,
            battle_only: effect.type === 'eliminate_wrong_answer' ? true : effect.metadata?.battle_only
          }
        }))
      : [];

    dispatch({
      type: 'UPDATE_INVENTORY',
      payload: {
        items: type === 'purchase'
          ? [...(state.inventory.items || []), {
              id: item.id,
              name: item.name,
              description: item.description,
              type: item.type,
              rarity: item.rarity,
              equipped: false,
              quantity,
              imageUrl: 'imageUrl' in item && item.imageUrl ? item.imageUrl : `/images/items/${item.id}.png`,
              effects: transformedEffects,
              metadata: {
                ...('metadata' in item ? item.metadata : {}),
                battle_only: transformedEffects.some(effect => effect.metadata?.battle_only)
              },
              is_active: true,
              acquired_at: new Date().toISOString()
            } as InventoryItem]
          : (state.inventory.items || []).map(i => 
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
  }, [state.inventory, dispatch]);

  const addItem = useCallback(async (item: GameItem, quantity: number, price: number) => {
    await handleItemTransaction(item, quantity, 'purchase', price);
  }, [handleItemTransaction]);

  const removeItem = useCallback(async (item: GameItem, quantity: number) => {
    await handleItemTransaction(item, quantity, 'use', 0);
  }, [handleItemTransaction]);

  const sellItem = useCallback(async (item: GameItem, quantity: number, price: number) => {
    await handleItemTransaction(item, quantity, 'sell', price);
  }, [handleItemTransaction]);

  const equipItem = useCallback(async (item: InventoryItem) => {
    dispatch({
      type: 'UPDATE_INVENTORY',
      payload: {
        items: state.inventory.items.map(i =>
          i.id === item.id
            ? { ...i, equipped: true }
            : i
        )
      }
    });
  }, [dispatch, state.inventory?.items]);

  const unequipItem = useCallback(async (item: InventoryItem) => {
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

  const useItem = useCallback(async (item: InventoryItem) => {
    await handleItemTransaction(item, 1, 'use', 0);
  }, [handleItemTransaction]);

  const getInventoryItem = useCallback((item_id: string): InventoryItem | undefined => {
    return state.inventory?.items?.find(i => i.id === item_id);
  }, [state.inventory?.items]);

  const getActiveEffects = useCallback((): ItemEffect[] => {
    return state.activeEffects;
  }, [state.activeEffects]);

  const hasActiveEffect = useCallback((effectType: string): boolean => {
    return state.activeEffects.some(effect => effect.type === effectType);
  }, [state.activeEffects]);

  const getEffectValue = useCallback((effectType: string): number => {
    const effect = state.activeEffects.find(e => e.type === effectType);
    return effect?.value || 0;
  }, [state.activeEffects]);

  // Transform inventory items to include battle_only metadata
  const transformedInventory = (state.inventory?.items || []).map(item => ({
    ...item,
    effects: Array.isArray(item.effects) 
      ? item.effects.map(effect => ({
          ...effect,
          metadata: {
            ...effect.metadata,
            battle_only: effect.type === 'eliminate_wrong_answer' ? true : effect.metadata?.battle_only
          }
        }))
      : [],
    metadata: {
      ...item.metadata,
      battle_only: Array.isArray(item.effects) && 
        item.effects.some(effect => effect.type === 'eliminate_wrong_answer')
    },
    imageUrl: item.imageUrl || `/images/items/${item.id}.png`,
    is_active: true
  } as InventoryItem));

  // Debug log
  console.log('Transformed inventory:', transformedInventory);
  console.log('Battle items:', transformedInventory.filter(item => 
    Array.isArray(item.effects) &&
    item.effects.some(effect => effect.metadata?.battle_only) &&
    item.quantity > 0
  ));

  return {
    inventory: transformedInventory,
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
