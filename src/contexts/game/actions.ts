import type { Dispatch } from 'react';
import type { GameState, GameAction, XPGain, GameItem, Quest, QuestRequirement } from './types';
import { supabase } from '../../lib/supabase';
import { calculate_level } from '../../utils/gameUtils';
import { calculateQuestProgress } from '../../utils/questUtils';
import type { QuestProgress } from '../../types/quests';

export const gameActions = {
  handleXPGain: async (
    state: GameState,
    xpGain: XPGain,
    dispatch: Dispatch<GameAction>
  ): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const multiplier = state.user.rewardMultipliers.xp * (state.user.streakMultiplier ?? 1);
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
      const newLevel = calculate_level(state.user.xp + totalXP);
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
      dispatch({ type: 'SET_LOADING', payload: true });

      const questProgress: QuestProgress = calculateQuestProgress(quest, progress);
      
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
  }
};
