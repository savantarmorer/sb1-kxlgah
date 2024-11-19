import React, { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Calendar, Gift, Settings } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import RewardNotification from './RewardNotification';
import AdminPanel from './AdminPanel';
import LoginCalendar from './LoginCalendar';
import { Reward } from '../../types/rewards';

export default function DailyRewardSystem() {
  const { state, dispatch } = useGame();
  const { t } = useLanguage();
  const [showNotification, setShowNotification] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const { value: lastLoginDate, setValue: setLastLoginDate } = useLocalStorage<string>('lastLoginDate', '');
  const [currentReward, setCurrentReward] = useState<Reward | null>(null);
  const isAdmin = state.user.roles?.includes('admin');

  // Initialize daily rewards
  const [rewards] = useState([
    { day: 1, reward: { type: 'coins', value: 100, rarity: 'common' } },
    { day: 2, reward: { type: 'xp', value: 200, rarity: 'common' } },
    { day: 3, reward: { type: 'coins', value: 300, rarity: 'rare' } },
    { day: 4, reward: { type: 'xp', value: 400, rarity: 'rare' } },
    { day: 5, reward: { type: 'coins', value: 500, rarity: 'epic' } },
    { day: 6, reward: { type: 'xp', value: 600, rarity: 'epic' } },
    { day: 7, reward: { type: 'coins', value: 1000, rarity: 'legendary' } }
  ]);

  useEffect(() => {
    checkDailyReward();
  }, []);

  const checkDailyReward = () => {
    const today = new Date().toISOString().split('T')[0];
    if (lastLoginDate !== today) {
      // Give daily reward
      const reward = {
        type: 'coins' as const,
        value: 100,
        rarity: 'common' as const
      };
      setCurrentReward(reward);
      setShowNotification(true);
      setLastLoginDate(today);
      
      // Record login
      dispatch({
        type: 'RECORD_LOGIN',
        payload: today
      });
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="text-indigo-500" size={24} />
          <h2 className="heading text-xl">{t('dailyRewards.title')}</h2>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAdminPanel(true)}
            className="icon-button"
          >
            <Settings size={20} />
          </button>
        )}
      </div>

      <LoginCalendar 
        loginDates={state.loginHistory}
        rewards={rewards}
        currentStreak={state.user.streak}
      />

      {showNotification && currentReward && (
        <RewardNotification
          reward={currentReward}
          onClose={() => setShowNotification(false)}
        />
      )}

      {showAdminPanel && (
        <AdminPanel 
          onClose={() => setShowAdminPanel(false)}
          rewards={rewards}
          onUpdateRewards={() => {}}
        />
      )}
    </div>
  );
}