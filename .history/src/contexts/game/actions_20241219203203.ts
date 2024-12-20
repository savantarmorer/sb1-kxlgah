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
      if (!state.user) {
        console.error('No user found in state');
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });

      if (type === 'purchase' && state.user.coins < cost) {
        throw new Error('Insufficient coins');
      }

      const updatedInventory = state.user.inventory ? [...state.user.inventory] : [];
      const existingItem = updatedInventory.find(i => i.id === item.id);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        updatedInventory.push({
          ...item,
          quantity,
          acquired_at: new Date().toISOString(),
          equipped: false
        });
      }

      // Update inventory in state
      dispatch({
        type: 'UPDATE_INVENTORY',
        payload: { items: updatedInventory }
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
      await supabase
        .from('user_inventory')
        .upsert(updatedInventory.map(item => ({
          user_id: state.user.id,
          item_id: item.id,
          quantity: item.quantity,
          acquired_at: item.acquired_at
        })));

    } catch (error) {
      console.error('Error handling item transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to process item transaction' });
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
          type: 'UPDATE_USER_STATS',
          payload: {
            quest_progress: {
              ...state.user.quest_progress,
              [quest.id]: questProgress
            }
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
        { items: state.user.inventory, activeEffects: [] }, 
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
            user_id: state.user.id,
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
