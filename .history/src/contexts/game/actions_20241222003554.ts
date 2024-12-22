import type { Dispatch } from 'react';
import type { GameState, GameAction, XPGain, GameItem, Quest } from './types';
import { supabase } from '../../lib/supabase.ts';
import { calculate_level } from '../../utils/gameUtils';
import { calculateQuestProgress } from '../../utils/questUtils';
import { NotificationSystem } from '../../utils/notifications';
import { inventoryReducer, type InventoryAction } from '../../reducers/inventoryReducer';
import type { Achievement } from '../../types/achievements';
import type { Reward } from '../../types/rewards';
import type { User } from '../../types/user';

export const gameActions = {
  handleXPGain: async (
    state: GameState,
    xpGain: XPGain,
    dispatch: Dispatch<GameAction>
  ): Promise<void> => {
    try {
      if (!state.user) {
        console.error('No user found in state');
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });

      const multiplier = (state.user.rewardMultipliers?.xp ?? 1) * (state.user.streakMultiplier ?? 1);
      const totalXP = Math.round(xpGain.amount * multiplier);

      // Update XP in state
      dispatch({
        type: 'ADD_XP',
        payload: {
          amount: totalXP,
          source: xpGain.source,
          reason: `${xpGain.reason} (x${multiplier})`
        }
      });

      // Check for level up
      const currentXP = state.user.xp ?? 0;
      const newLevel = calculate_level(currentXP + totalXP);
      if (newLevel > state.user.level) {
        dispatch({
          type: 'LEVEL_UP',
          payload: {
            level: newLevel,
            rewards: [
              {
                id: 'level_up_xp',
                type: 'xp',
                amount: 0,
                name: 'XP Bonus',
                description: 'Level up XP reward',
                value: 0
              },
              {
                id: 'level_up_coins',
                type: 'coins',
                amount: newLevel * 100,
                name: 'Coin Bonus',
                description: 'Level up coin reward',
                value: newLevel * 100
              }
            ]
          }
        });
      }

      // Log the values before updating the database
      console.log(`Updating user progress: XP: ${state.user.xp + totalXP}, Level: ${newLevel}`);
      console.log(`New XP: ${state.user.xp + totalXP}, New Level: ${newLevel}`);

      // Update XP and level in database
      const { error } = await supabase
        .from('profiles')
        .update({ 
          xp: state.user.xp + totalXP,
          level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', state.user.id);

      if (error) {
        console.error('Failed to update user progress:', error);
        throw error;
      }

    } catch (error) {
      console.error('Error handling XP gain:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to process XP gain' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  },

  handleCoinTransaction: async (
    state: GameState,
    amount: { amount: number; source: string },
    dispatch: Dispatch<GameAction>
  ): Promise<void> => {
    try {
      if (!state.user) {
        console.error('No user found in state');
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });

      // Update coins in state
      dispatch({
        type: 'ADD_COINS',
        payload: {
          amount: amount.amount,
          source: amount.source
        }
      });

      // Update coins in database
      const { error } = await supabase
        .from('profiles')
        .update({ 
          coins: state.user.coins + amount.amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', state.user.id);

      if (error) {
        console.error('Failed to update coins:', error);
        throw error;
      }

    } catch (error) {
      console.error('Error handling coin transaction:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  },

  handleItemTransaction: async (
    state: GameState,
    item: GameItem,
    quantity: number,
    type: 'purchase' | 'reward' | 'use',
    cost: number,
    dispatch: Dispatch<GameAction>
  ): Promise<void> => {
    try {
      if (!state.user?.id) {
        console.error('No user found in state');
        return;
      }

      const user = state.user; // Store user in a const to avoid null checks

      dispatch({ type: 'SET_LOADING', payload: true });

      if (type === 'purchase' && user.coins < cost) {
        throw new Error('Insufficient coins');
      }

      // Create a copy of the inventory and filter out items with 0 quantity
      const currentInventory = state.inventory?.items?.filter(i => i.quantity > 0) || [];
      const updatedInventory = [...currentInventory];
      const existingItemIndex = updatedInventory.findIndex(i => i.id === item.id);

      // Log the current state for debugging
      console.log('[handleItemTransaction] Current state:', {
        type,
        itemId: item.id,
        existingItemIndex,
        currentQuantity: existingItemIndex >= 0 ? updatedInventory[existingItemIndex]?.quantity : 0,
        updatedInventory
      });

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const currentItem = updatedInventory[existingItemIndex];
        if (!currentItem) {
          console.error('[handleItemTransaction] Item found but undefined:', {
            index: existingItemIndex,
            itemId: item.id
          });
          throw new Error('Item not found in inventory');
        }

        const newQuantity = type === 'purchase' 
          ? currentItem.quantity + quantity
          : currentItem.quantity - quantity;

        if (newQuantity <= 0) {
          // Remove item if quantity is 0 or less
          updatedInventory.splice(existingItemIndex, 1);
        } else {
          // Update quantity
          updatedInventory[existingItemIndex] = {
            ...currentItem,
            quantity: newQuantity
          };
        }
      } else if (type === 'purchase') {
        // Add new item only for purchases
        updatedInventory.push({
          ...item,
          id: item.id,
          itemId: item.id,
          quantity,
          acquired_at: new Date().toISOString(),
          equipped: false
        });
      } else {
        console.error('[handleItemTransaction] Cannot use/update non-existent item:', {
          type,
          itemId: item.id
        });
        throw new Error('Item not found in inventory');
      }

      // Filter out any items with 0 quantity before updating state
      const finalInventory = updatedInventory.filter(item => item.quantity > 0);

      // Log the updated state for debugging
      console.log('[handleItemTransaction] Updated state:', {
        type,
        itemId: item.id,
        updatedInventory: finalInventory,
        removedItems: updatedInventory.length - finalInventory.length
      });

      // Update inventory in state
      dispatch({
        type: 'UPDATE_INVENTORY',
        payload: { items: finalInventory }
      });

      if (type === 'purchase') {
        dispatch({
          type: 'ADD_COINS',
          payload: {
            amount: -cost,
            source: 'item_purchase'
          }
        });
      }

      // Update inventory in database
      if (type === 'use' && existingItemIndex >= 0 && updatedInventory[existingItemIndex]?.quantity <= 0) {
        // Delete item from database if quantity is 0
        const { error: deleteError } = await supabase
          .from('user_inventory')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', item.id);

        if (deleteError) throw deleteError;
      } else {
        try {
          // First try to update the existing item
          const { error: updateError } = await supabase
            .from('user_inventory')
            .update({
              quantity: type === 'purchase' 
                ? (existingItemIndex >= 0 ? updatedInventory[existingItemIndex]?.quantity || quantity : quantity)
                : (existingItemIndex >= 0 ? updatedInventory[existingItemIndex]?.quantity || 0 : 0),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('item_id', item.id);

          // If the item doesn't exist, insert it
          if (updateError && updateError.code === 'PGRST116') {
            const { error: insertError } = await supabase
              .from('user_inventory')
              .insert({
                user_id: user.id,
                item_id: item.id,
                quantity: quantity,
                acquired_at: new Date().toISOString(),
                equipped: false,
                updated_at: new Date().toISOString()
              });

            if (insertError) throw insertError;
          } else if (updateError) {
            throw updateError;
          }

          // Update user coins in database if it's a purchase
          if (type === 'purchase') {
            const { error: coinError } = await supabase
              .from('profiles')
              .update({ 
                coins: user.coins - cost,
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id);

            if (coinError) throw coinError;
          }
        } catch (dbError: any) {
          console.error('[handleItemTransaction] Database error:', dbError);
          
          // If we get a unique constraint violation, try to update the item instead
          if (dbError.code === '23505') {
            const { error: retryError } = await supabase
              .from('user_inventory')
              .update({
                quantity: type === 'purchase' 
                  ? (existingItemIndex >= 0 ? updatedInventory[existingItemIndex]?.quantity || quantity : quantity)
                  : (existingItemIndex >= 0 ? updatedInventory[existingItemIndex]?.quantity || 0 : 0),
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id)
              .eq('item_id', item.id);

            if (retryError) throw retryError;
          } else {
            throw dbError;
          }
        }
      }

    } catch (error) {
      console.error('Error handling item transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to process item transaction' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  },

  handleQuestProgress: async (
    state: GameState,
    quest: Quest,
    progress: number,
    dispatch: Dispatch<GameAction>
  ): Promise<void> => {
    try {
      if (!state.user) {
        console.error('No user found in state');
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });

      const questProgress = calculateQuestProgress(quest, progress);
      
      if (questProgress.completed) {
        dispatch({
          type: 'UPDATE_QUESTS',
          payload: {
            active: state.quests.active.filter(q => q.id !== quest.id),
            completed: [...state.quests.completed, { ...quest, progress: progress }]
          }
        });

        // Grant quest rewards
        if (questProgress.rewards.xp) {
          await gameActions.handleXPGain(state, {
            amount: questProgress.rewards.xp,
            source: 'quest_completion',
            timestamp: new Date().toISOString(),
            details: { quest_id: quest.id }
          }, dispatch);
        }

        if (questProgress.rewards.coins) {
          await gameActions.handleCoinTransaction(state, {
            amount: questProgress.rewards.coins,
            source: 'quest_completion'
          }, dispatch);
        }

        // Update quest status in database
        await supabase
          .from('user_quests')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('user_id', state.user.id)
          .eq('quest_id', quest.id);
      }

    } catch (error) {
      console.error('Error handling quest progress:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update quest progress' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  },

  handleInventoryAction: async (
    state: GameState,
    action: InventoryAction,
    dispatch: Dispatch<GameAction>
  ): Promise<void> => {
    try {
      if (!state.user) {
        console.error('No user found in state');
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });

      // Use the inventory reducer to calculate the new state
      const newInventoryState = inventoryReducer(
        { items: state.inventory?.items || [], activeEffects: state.activeEffects || [] }, 
        action
      );

      // Update inventory in state
      dispatch({
        type: 'UPDATE_INVENTORY',
        payload: { items: newInventoryState.items }
      });

      // Update inventory in database
      const { error } = await supabase
        .from('user_inventory')
        .upsert(
          newInventoryState.items.map(item => ({
            user_id: state.user?.id,
            item_id: item.itemId,
            quantity: item.quantity,
            is_equipped: item.equipped,
            last_used: item.last_used,
            stats: item.stats,
            effects: item.effects
          }))
        );

      if (error) throw error;

    } catch (error) {
      console.error('Error handling inventory action:', error);
      NotificationSystem.showError('Failed to update inventory');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  },

  handleBattleAction: async (
    state: GameState,
    action: GameAction,
    dispatch: Dispatch<GameAction>
  ): Promise<void> => {
    try {
      if (!state.user) {
        console.error('No user found in state');
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });

      switch (action.type) {
        case 'INITIALIZE_BATTLE':
        case 'ANSWER_QUESTION':
        case 'END_BATTLE':
          dispatch(action);
          break;

        default:
          break;
      }

      // Update battle stats in database if needed
      if (state.battle && state.battle.status === 'completed') {
        const { error } = await supabase
          .from('battle_stats')
          .upsert({
            user_id: state.user.id,
            total_battles: state.battle_stats.total_battles,
            wins: state.battle_stats.wins,
            losses: state.battle_stats.losses,
            win_streak: state.battle_stats.win_streak,
            highest_streak: state.battle_stats.highest_streak,
            total_xp_earned: state.battle_stats.total_xp_earned,
            total_coins_earned: state.battle_stats.total_coins_earned,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

    } catch (error) {
      console.error('Error handling battle action:', error);
      NotificationSystem.showError('Failed to update battle state');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }
};

export type AchievementAction = 
  | { type: 'SYNC_ACHIEVEMENTS'; payload: Achievement[] }
  | { type: 'UNLOCK_ACHIEVEMENTS'; payload: Achievement[] }
  | { type: 'UPDATE_ACHIEVEMENT'; payload: { id: string; progress: number } };

export type UserStatsAction = {
  type: 'UPDATE_USER_STATS';
  payload: {
    xp: number;
    coins: number;
    streak: number;
  };
};

export type QuestAction = 
  | { type: 'INITIALIZE_QUESTS'; payload: { active: Quest[]; completed: Quest[] } }
  | { type: 'UPDATE_QUEST_PROGRESS'; payload: { questId: string; progress: number } }
  | { type: 'COMPLETE_QUEST'; payload: Quest }
  | { type: 'SYNC_QUESTS'; payload: Quest[] }
  | { type: 'UPDATE_QUEST'; payload: Quest }
  | { type: 'HANDLE_QUEST_COMPLETION'; payload: { quest: Quest } };

export type UserAction = 
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<User> }
  | { type: 'UPDATE_USER_STATS'; payload: { xp: number; coins: number; streak: number } }
  | { type: 'ADD_XP'; payload: { amount: number; source: string; reason?: string } }
  | { type: 'ADD_COINS'; payload: { amount: number; source: string } }
  | { type: 'UPDATE_COINS'; payload: number }
  | { type: 'CLAIM_REWARD'; payload: Reward };

export type SystemAction = 
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };