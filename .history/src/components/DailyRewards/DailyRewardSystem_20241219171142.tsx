import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Gift, Flame, Settings } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import LoginCalendar from './LoginCalendar';
import RewardNotification from './RewardNotification';
import StreakDisplay from './StreakDisplay';
import AdminPanel from './AdminPanel';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { formatISO, isToday, parseISO } from 'date-fns';
import { useDailyRewards } from '../../hooks/useDailyRewards';
import type { GameAction } from '../../contexts/game/types';
import { supabase } from '../../lib/supabase';
import { ItemType, ItemRarity } from '../../types/items';

/**
 * Interface for daily reward structure
 * Used by:
 * - DailyRewardSystem component
 * - LoginCalendar component
 * - AdminPanel component
 * Dependencies:
 * - GameContext for state management
 * - RewardNotification for displaying rewards
 */
interface DailyReward {
  day: number;
  reward: {
    type: 'xp' | 'coins' | 'item';
    value: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
}

/**
 * Main component for daily rewards system
 * Role: Manages daily login rewards and streak system
 * Dependencies:
 * - GameContext for state management
 * - useLocalStorage for persistence
 * - useDailyRewards for reward logic
 * - LoginCalendar for UI
 * - StreakDisplay for streak UI
 * - AdminPanel for admin controls
 * Used by:
 * - Main game interface
 * - Profile dashboard
 * Integration points:
 * - XP system
 * - Inventory system
 * - Achievement system
 */
export default function DailyRewardSystem(): JSX.Element | null {
  const { state, dispatch } = useGame();
  const { dailyRewards, canClaimDailyReward } = useDailyRewards();
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [lastLoginDate, setLastLoginDate] = useLocalStorage<string>('last_login_date', '');
  const [currentReward, setCurrentReward] = useState<DailyReward['reward'] | null>(null);
  const isAdmin = state.user?.roles?.includes('admin') || false;

  // Define reward tiers with increasing values and better rewards
  const DAILY_REWARDS: DailyReward[] = [
    { day: 1, reward: { type: 'xp', value: 100, rarity: 'common' } },
    { day: 2, reward: { type: 'coins', value: 50, rarity: 'common' } },
    { day: 3, reward: { type: 'xp', value: 150, rarity: 'rare' } },
    { day: 4, reward: { type: 'coins', value: 100, rarity: 'rare' } },
    { day: 5, reward: { type: 'xp', value: 250, rarity: 'epic' } },
    { day: 6, reward: { type: 'coins', value: 200, rarity: 'epic' } },
    { day: 7, reward: { type: 'item', value: 500, rarity: 'legendary' } }
  ];

  /**
   * Function: Calculate streak multiplier
   * Role: Determines reward multiplier based on streak length
   * Used by:
   * - Streak multiplier update
   * - Reward calculation
   */
  const calculateStreakMultiplier = useCallback((streak: number): number => {
    if (streak >= 30) return 2.0;
    if (streak >= 14) return 1.8;
    if (streak >= 7) return 1.5;
    if (streak >= 3) return 1.2;
    return 1.0;
  }, []);

  /**
   * Function: Update streak multiplier
   * Role: Dispatches streak multiplier update
   * Dependencies:
   * - GameContext dispatch
   * - calculateStreakMultiplier
   */
  const updateStreakMultiplier = useCallback((streak: number): void => {
    dispatch({ 
      type: 'UPDATE_USER_PROFILE', 
      payload: { 
        streak,
        streakMultiplier: calculateStreakMultiplier(streak)
      } 
    });
  }, [dispatch, calculateStreakMultiplier]);

  /**
   * Function: Check daily login
   * Role: Handles daily login reward logic
   * Dependencies:
   * - GameContext for state/dispatch
   * - useLocalStorage for date tracking
   * Integration points:
   * - Streak system
   * - Reward system
   */
  const checkDailyLogin = useCallback(async (): Promise<void> => {
    if (!state.user) return;

    const today = formatISO(new Date(), { representation: 'date' });
    
    if (!lastLoginDate || !isToday(parseISO(lastLoginDate))) {
      const streak = state.user.streak || 0;
      const dayIndex = streak % DAILY_REWARDS.length;
      
      if (dayIndex >= 0 && dayIndex < DAILY_REWARDS.length) {
        const reward = DAILY_REWARDS[dayIndex].reward;
        setCurrentReward(reward);
        setShowNotification(true);
      } else {
        setCurrentReward(DAILY_REWARDS[0].reward);
        setShowNotification(true);
      }
      
      setLastLoginDate(today);
      
      if (!state.user.login_history?.includes(today)) {
        const newStreak = (state.user.streak || 0) + 1;
        const currentHistory = state.user.login_history || [];
        
        // Update database
        await supabase
          .from('user_logins')
          .insert({
            user_id: state.user.id,
            login_date: today,
            streak_maintained: true,
            created_at: new Date().toISOString()
          });

        // Update user progress
        await supabase
          .from('user_progress')
          .update({
            streak: newStreak,
            streak_multiplier: calculateStreakMultiplier(newStreak),
            last_daily_reset: today
          })
          .eq('user_id', state.user.id);

        // Update local state
        dispatch({ 
          type: 'UPDATE_USER_PROFILE', 
          payload: { 
            streak: newStreak,
            streakMultiplier: calculateStreakMultiplier(newStreak)
          } 
        });
      }
    }
  }, [state.user, lastLoginDate, DAILY_REWARDS, setLastLoginDate, dispatch, updateStreakMultiplier]);

  /**
   * Function: Handle claim reward
   * Role: Processes reward claims and updates game state
   * Dependencies:
   * - GameContext for dispatch
   * - Current reward state
   * Integration points:
   * - XP system
   * - Currency system
   * - Inventory system
   */
  const handleClaimReward = useCallback((): void => {
    if (!currentReward || !state.user) return;

    const multiplier = state.user.streakMultiplier || 1;
    const value = Math.floor(currentReward.value * multiplier);

    const dispatchReward = (action: GameAction): void => {
      dispatch(action);
    };

    if (currentReward.type === 'xp') {
      dispatchReward({ 
        type: 'ADD_XP', 
        payload: { 
          amount: value,
          source: 'daily_reward',
          timestamp: new Date().toISOString()
        } 
      });
    } else if (currentReward.type === 'coins') {
      dispatchReward({ 
        type: 'ADD_COINS', 
        payload: { 
          amount: value,
          source: 'daily_reward'
        } 
      });
    } else if (currentReward.type === 'item') {
      dispatchReward({
        type: 'UPDATE_INVENTORY',
        payload: {
          items: [{
            id: `daily_reward_${Date.now()}`,
            name: 'Daily Reward Lootbox',
            description: 'A lootbox earned from daily rewards',
            type: ItemType.LOOTBOX,
            rarity: ItemRarity[currentReward.rarity.toUpperCase() as keyof typeof ItemRarity],
            equipped: false,
            quantity: 1,
            imageUrl: '/assets/lootbox.png',
            metadata: {
              source: 'daily_reward',
              claimed_at: new Date().toISOString(),
              value: value
            }
          }]
        }
      });
    }

    // Record the reward claim in user stats
    dispatchReward({
      type: 'UPDATE_USER_STATS',
      payload: {
        quest_progress: {
          daily_rewards: {
            last_claim: new Date().toISOString(),
            reward: currentReward,
            value: value,
            multiplier: multiplier
          }
        }
      }
    });

    setShowNotification(false);
  }, [currentReward, state.user, dispatch]);

  // Effect: Initialize daily rewards check
  useEffect(() => {
    if (state.user && canClaimDailyReward()) {
      checkDailyLogin();
    }
  }, [state.user, canClaimDailyReward, checkDailyLogin]);

  // Effect: Update streak multiplier
  useEffect(() => {
    const streak = state.user?.streak ?? 0;
    if (streak > 0) {
      updateStreakMultiplier(streak);
    }
  }, [state.user?.streak, updateStreakMultiplier]);

  // Don't render if user is not loaded
  if (!state.user) {
    return null;
  }

  const streak = state.user.streak ?? 0;
  const loginHistory = state.user.login_history ?? [];
  const streakMultiplier = state.user.streakMultiplier ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Daily Rewards
        </h2>
        {isAdmin && (
          <button
            onClick={() => setShowAdminPanel(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Settings size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>

      <StreakDisplay streak={streak} />
      
      <LoginCalendar
        loginDates={loginHistory}
        rewards={DAILY_REWARDS}
        current_streak={streak}
      />

      <AnimatePresence>
        {showNotification && currentReward && (
          <RewardNotification
            reward={currentReward}
            on_claim={handleClaimReward}
            multiplier={streakMultiplier}
          />
        )}
      </AnimatePresence>

      {showAdminPanel && (
        <AdminPanel
          on_close={() => setShowAdminPanel(false)}
          rewards={DAILY_REWARDS}
          on_update_rewards={(newRewards) => {
            dispatch({
              type: 'UPDATE_USER_STATS',
              payload: { 
                quest_progress: {
                  daily_rewards: newRewards
                }
              }
            });
          }}
        />
      )}
    </div>
  );
}