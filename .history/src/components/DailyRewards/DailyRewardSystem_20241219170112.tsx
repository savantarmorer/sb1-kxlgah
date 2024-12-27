import React, { useState, useEffect } from 'react';
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
export default function DailyRewardSystem() {
  const { state, dispatch } = useGame();
  const { dailyRewards, canClaimDailyReward } = useDailyRewards();
  const [show_notification, setShowNotification] = useState(false);
  const [show_admin_panel, setShowAdminPanel] = useState(false);
  const [last_login_date, setLastLoginDate] = useLocalStorage('last_login_date', '');
  const [current_reward, setCurrentReward] = useState<DailyReward['reward'] | null>(null);
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
   * Effect: Initialize daily rewards check
   * Role: Checks for available rewards on component mount and user state changes
   * Dependencies:
   * - state.user for user data
   * - check_daily_login function
   */
  useEffect(() => {
    if (state.user && canClaimDailyReward()) {
      check_daily_login();
    }
  }, [state.user]);

  /**
   * Effect: Update streak multiplier
   * Role: Updates reward multipliers based on streak
   * Dependencies:
   * - state.user.streak for streak count
   * - GameContext dispatch for updates
   */
  useEffect(() => {
    if (state.user?.streak > 0) {
      dispatch({ 
        type: 'UPDATE_STREAK_MULTIPLIER', 
        payload: { 
          streak: state.user.streak,
          multiplier: calculateStreakMultiplier(state.user.streak)
        } 
      });
    }
  }, [state.user?.streak]);

  /**
   * Function: Calculate streak multiplier
   * Role: Determines reward multiplier based on streak length
   * Used by:
   * - Streak multiplier update
   * - Reward calculation
   */
  const calculateStreakMultiplier = (streak: number): number => {
    if (streak >= 30) return 2.0;
    if (streak >= 14) return 1.8;
    if (streak >= 7) return 1.5;
    if (streak >= 3) return 1.2;
    return 1.0;
  };

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
  const check_daily_login = () => {
    if (!state.user) return;

    const today = formatISO(new Date(), { representation: 'date' });
    
    if (!last_login_date || !isToday(parseISO(last_login_date))) {
      const streak = state.user.streak || 0;
      const day_index = streak % DAILY_REWARDS.length;
      
      if (day_index >= 0 && day_index < DAILY_REWARDS.length) {
        const reward = DAILY_REWARDS[day_index].reward;
        setCurrentReward(reward);
        setShowNotification(true);
      } else {
        setCurrentReward(DAILY_REWARDS[0].reward);
        setShowNotification(true);
      }
      
      setLastLoginDate(today);
      
      if (!state.login_history?.includes(today)) {
        dispatch({ type: 'INCREMENT_STREAK', payload: { date: today } });
        dispatch({ type: 'RECORD_LOGIN', payload: { date: today } });
        dispatch({ 
          type: 'UPDATE_STREAK_MULTIPLIER', 
          payload: { 
            streak: (state.user.streak || 0) + 1,
            multiplier: calculateStreakMultiplier((state.user.streak || 0) + 1)
          } 
        });
      }
    }
  };

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
  const handle_claim_reward = () => {
    if (!current_reward || !state.user) return;

    const multiplier = state.user.streakMultiplier || 1;
    const value = Math.floor(current_reward.value * multiplier);

    if (current_reward.type === 'xp') {
      dispatch({ 
        type: 'ADD_XP', 
        payload: { 
          amount: value,
          source: 'daily_reward',
          timestamp: Date.now()
        } 
      });
    } else if (current_reward.type === 'coins') {
      dispatch({ 
        type: 'ADD_COINS', 
        payload: { 
          amount: value,
          source: 'daily_reward'
        } 
      });
    } else if (current_reward.type === 'item') {
      dispatch({
        type: 'ADD_ITEM',
        payload: {
          type: 'lootbox',
          rarity: current_reward.rarity,
          value: value,
          source: 'daily_reward'
        }
      });
    }

    // Record reward claim
    dispatch({
      type: 'RECORD_REWARD_CLAIM',
      payload: {
        type: 'daily_reward',
        reward: current_reward,
        value: value,
        multiplier: multiplier,
        timestamp: Date.now()
      }
    });

    setShowNotification(false);
  };

  if (!state.user) {
    return null;
  }

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

      <StreakDisplay streak={state.user.streak || 0} />
      
      <LoginCalendar
        loginDates={state.login_history || []}
        rewards={DAILY_REWARDS}
        current_streak={state.user.streak || 0}
      />

      <AnimatePresence>
        {show_notification && current_reward && (
          <RewardNotification
            reward={current_reward}
            on_claim={handle_claim_reward}
            multiplier={state.user.streakMultiplier || 1}
          />
        )}
      </AnimatePresence>

      {show_admin_panel && (
        <AdminPanel
          on_close={() => setShowAdminPanel(false)}
          rewards={DAILY_REWARDS}
          on_update_rewards={(new_rewards) => {
            dispatch({
              type: 'UPDATE_DAILY_REWARDS',
              payload: { rewards: new_rewards }
            });
          }}
        />
      )}
    </div>
  );
}