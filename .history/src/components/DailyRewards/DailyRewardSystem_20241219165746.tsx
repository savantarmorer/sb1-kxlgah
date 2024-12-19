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

interface DailyReward {
  day: number;
  reward: {
    type: 'xp' | 'coins' | 'item';
    value: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
}

export default function DailyRewardSystem() {
  const { state, dispatch } = useGame();
  const [show_notification, setShowNotification] = useState(false);
  const [show_admin_panel, setShowAdminPanel] = useState(false);
  const [last_login_date, setLastLoginDate] = useLocalStorage('last_login_date', '');
  const [current_reward, setCurrentReward] = useState<DailyReward['reward'] | null>(null);
  const isAdmin = state.user?.roles?.includes('admin') || false;

  const DAILY_REWARDS: DailyReward[] = [
    { day: 1, reward: { type: 'xp', value: 100, rarity: 'common' } },
    { day: 2, reward: { type: 'coins', value: 50, rarity: 'common' } },
    { day: 3, reward: { type: 'xp', value: 150, rarity: 'rare' } },
    { day: 4, reward: { type: 'coins', value: 100, rarity: 'rare' } },
    { day: 5, reward: { type: 'xp', value: 250, rarity: 'epic' } },
    { day: 6, reward: { type: 'coins', value: 200, rarity: 'epic' } },
    { day: 7, reward: { type: 'item', value: 500, rarity: 'legendary' } }
  ];

  useEffect(() => {
    if (state.user) {
      check_daily_login();
    }
  }, [state.user]);

  useEffect(() => {
    if (state.user?.streak > 0) {
      dispatch({ type: 'UPDATE_STREAK_MULTIPLIER', payload: { streak: state.user.streak } });
    }
  }, [state.user?.streak]);

  const check_daily_login = () => {
    if (!state.user) return;

    const today = formatISO(new Date(), { representation: 'date' });
    
    if (!last_login_date || !isToday(parseISO(last_login_date))) {
      // Calculate day index and ensure it's within bounds
      const streak = state.user.streak || 0;
      const day_index = streak % DAILY_REWARDS.length;
      
      if (day_index >= 0 && day_index < DAILY_REWARDS.length) {
        const reward = DAILY_REWARDS[day_index].reward;
        setCurrentReward(reward);
        setShowNotification(true);
      } else {
        // Fallback to first day reward if something goes wrong
        setCurrentReward(DAILY_REWARDS[0].reward);
        setShowNotification(true);
      }
      
      setLastLoginDate(today);
      
      if (!state.login_history?.includes(today)) {
        dispatch({ type: 'INCREMENT_STREAK', payload: { date: today } });
        dispatch({ type: 'RECORD_LOGIN', payload: { date: today } });
        dispatch({ type: 'UPDATE_STREAK_MULTIPLIER', payload: { streak: (state.user.streak || 0) + 1 } });
      }
    }
  };

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
    setShowNotification(false);
  };

  // Don't render if user is not loaded
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
            // Handle reward updates
            console.log('Updated rewards:', new_rewards);
          }}
        />
      )}
    </div>
  );
}