/**
 * PremiumRewards Component
 * 
 * Displays and manages premium rewards that users can purchase with coins
 * Integrates with LootBox for reward animations
 * 
 * Dependencies:
 * - GameContext: For user coins and purchase actions
 * - LanguageContext: For translations
 * - LootBox: For reward animations
 */

import React, { useState } from 'react';
import { Crown, Book, Users, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../../contexts/GameContext';
import { use_language } from '../../contexts/LanguageContext';
import LootBox from '../LootBox';
import Button from '../Button';
import type { Reward } from '../../types';
import { supabase } from '../../lib/supabase';

interface PremiumReward {
  id: string;
  title: string;
  description: string;
  cost: number;
  type: 'material' | 'session';
  rarity: 'epic' | 'legendary';
  icon: JSX.Element;
  available: boolean;
}

export function PremiumRewards() {
  const { state, dispatch } = useGame();
  const { t } = use_language();
  const [showLootBox, setShowLootBox] = useState(false);
  const [selectedReward, setSelectedReward] = useState<PremiumReward | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Premium rewards configuration
   * Each reward has unique properties and requirements
   */
  const PREMIUM_REWARDS: PremiumReward[] = [
    {
      id: 'mock_exam_bundle',
      title: t('store.items.studyMaterial.title'),
      description: t('store.items.studyMaterial.description'),
      cost: 2000,
      type: 'material',
      rarity: 'epic',
      icon: <Book className="text-purple-500" />,
      available: true
    },
    {
      id: 'expert_session',
      title: t('store.items.expertSession.title'),
      description: t('store.items.expertSession.description'),
      cost: 5000,
      type: 'session',
      rarity: 'legendary',
      icon: <Users className="text-yellow-500" />,
      available: true
    }
  ];

  /**
   * Handles the purchase of a premium reward
   * Checks coin balance, dispatches purchase action, and shows reward animation
   */
  const handlePurchase = async (reward: PremiumReward) => {
    if (!state.user?.coins || state.user.coins < reward.cost) {
      setError('Not enough coins to purchase this reward');
      return;
    }

    try {
      // Dispatch purchase action
      dispatch({
        type: 'PURCHASE_ITEM',
        payload: {
          item_id: reward.id,
          cost: reward.cost
        }
      });

      // Show reward animation
      setSelectedReward(reward);
      setShowLootBox(true);

      // Update database
      const { error } = await supabase
        .from('user_inventory')
        .insert({
          user_id: state.user.id,
          item_id: reward.id,
          acquired_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error purchasing reward:', err);
      setError('Failed to purchase reward. Please try again.');
      
      // Revert the purchase if database update fails
      if (state.user) {
        dispatch({
          type: 'update_user_stats',
          payload: {
            coins: state.user.coins + reward.cost,
            xp: state.user.xp,
            streak: state.user.streak
          }
        });
      }
    }
  };

  return (
    <div className="card">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Crown className="text-yellow-500" />
          <h2 className="heading text-xl">{t('rewards.premium.title')}</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="text-yellow-500" />
          <span className="font-bold text-gray-900 dark:text-white">
            {state.user.coins} {t('common.coins')}
          </span>
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PREMIUM_REWARDS.map(reward => (
          <motion.div
            key={reward.id}
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-lg border ${
              state.user.coins >= reward.cost
                ? 'border-brand-teal-200 dark:border-brand-teal-800 hover:border-brand-teal-300 dark:hover:border-brand-teal-700'
                : 'border-gray-200 dark:border-gray-700 opacity-50'
            } transition-all`}
          >
            <div className="flex items-start space-x-4">
              {/* Reward Icon */}
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                {reward.icon}
              </div>

              {/* Reward Details */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {reward.title}
                </h3>
                <p className="text-sm text-muted mt-1">
                  {reward.description}
                </p>

                {/* Purchase Section */}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-medium text-primary">
                    {reward.cost} {t('common.coins')}
                  </span>
                  <Button
                    variant={state.user.coins >= reward.cost ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => handlePurchase(reward)}
                    disabled={state.user.coins < reward.cost}
                  >
                    {t('common.purchase')}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Reward Animation */}
      {selectedReward && (
        <LootBox
          is_open={showLootBox}
          on_close={() => {
            setShowLootBox(false);
            setSelectedReward(null);
          }}
          rewards={[
            {
              id: selectedReward.id,
              type: selectedReward.type === 'material' ? 'item' : 'lootbox',
              value: selectedReward.title,
              rarity: selectedReward.rarity
            } as Reward
          ]}
        />
      )}
    </div>
  );
}

/**
 * Component Dependencies:
 * - GameContext: For user coins and purchase actions
 * - LanguageContext: For translations
 * - LootBox: For reward animations
 * - Button: For UI interactions
 * 
 * Used By:
 * - Store component
 * - UserProfile component (premium section)
 * 
 * Updates:
 * - When purchases are made
 * - When coin balance changes
 * - When rewards are claimed
 * 
 * Role in System:
 * - Premium content delivery
 * - Monetization system
 * - Reward distribution
 */