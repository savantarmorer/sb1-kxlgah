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
 * - Database tables: user_inventory, shop_transactions, pending_lootboxes
 */

import React, { useState } from 'react';
import { Crown, Book, Users, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../../contexts/GameContext';
import { use_language } from '../../contexts/LanguageContext';
import LootBox from '../LootBox';
import Button from '../Button';
import type { Reward, RewardType, RewardRarity } from '../../types/rewards';
import { supabase } from '../../lib/supabase';

interface PremiumReward {
  id: string;
  title: string;
  description: string;
  cost: number;
  type: Extract<RewardType, 'item' | 'lootbox'>;
  rarity: Extract<RewardRarity, 'epic' | 'legendary'>;
  icon: JSX.Element;
  available: boolean;
  metadata?: {
    effect_multiplier?: number;
    allowed_combinations?: string[];
    requirements?: {
      level?: number;
      achievements?: string[];
    };
    [key: string]: any;
  };
}

export function PremiumRewards() {
  const { state, dispatch } = useGame();
  const { t } = use_language();
  const [showLootBox, setShowLootBox] = useState(false);
  const [selectedReward, setSelectedReward] = useState<PremiumReward | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Early return if no user
  if (!state.user) {
    return null;
  }

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
      type: 'item',
      rarity: 'epic',
      icon: <Book className="text-purple-500" />,
      available: true
    },
    {
      id: 'expert_session',
      title: t('store.items.expertSession.title'),
      description: t('store.items.expertSession.description'),
      cost: 5000,
      type: 'lootbox',
      rarity: 'legendary',
      icon: <Users className="text-yellow-500" />,
      available: true
    }
  ];

  /**
   * Handles the purchase of a premium reward
   * Updates user inventory, coins, and transaction history
   */
  const handlePurchase = async (reward: PremiumReward) => {
    if (isProcessing) return;
    
    const userCoins = state.user.coins || 0;
    if (userCoins < reward.cost) {
      setError(t('errors.insufficientCoins'));
      return;
    }

    // Check level requirement if exists
    if (reward.metadata?.requirements?.level && state.user.level < reward.metadata.requirements.level) {
      setError(t('errors.insufficientLevel'));
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Start a Supabase transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('shop_transactions')
        .insert({
          user_id: state.user.id,
          item_id: reward.id,
          quantity: 1,
          price_paid: reward.cost,
          transaction_type: 'purchase',
          metadata: {
            reward_type: reward.type,
            rarity: reward.rarity,
            effect_multiplier: reward.metadata?.effect_multiplier,
            allowed_combinations: reward.metadata?.allowed_combinations
          }
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update user inventory with metadata
      const { error: inventoryError } = await supabase
        .from('user_inventory')
        .insert({
          user_id: state.user.id,
          item_id: reward.id,
          quantity: 1,
          acquired_at: new Date().toISOString(),
          active_effects: reward.metadata?.effect_multiplier ? [{
            type: reward.type,
            multiplier: reward.metadata.effect_multiplier,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
          }] : undefined
        });

      if (inventoryError) throw inventoryError;

      // Update user coins in profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          coins: userCoins - reward.cost,
          updated_at: new Date().toISOString()
        })
        .eq('id', state.user.id);

      if (profileError) throw profileError;

      // Update local state
      dispatch({
        type: 'UPDATE_USER_PROGRESS',
        payload: {
          coins: userCoins - reward.cost,
          xp: state.user.xp,
          streak: state.user.streak,
          level: state.user.level
        }
      });

      // Show reward animation
      setSelectedReward(reward);
      setShowLootBox(true);

    } catch (err) {
      console.error('Error purchasing reward:', err);
      setError(t('errors.purchaseFailed'));
      
      // Revert the purchase if database update fails
      dispatch({
        type: 'UPDATE_USER_PROGRESS',
        payload: {
          coins: userCoins,
          xp: state.user.xp,
          streak: state.user.streak,
          level: state.user.level
        }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseLootBox = () => {
    setShowLootBox(false);
    setSelectedReward(null);
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
            {state.user.coins || 0} {t('common.coins')}
          </span>
        </div>
      </div>

      {error && (
        <div className="text-red-500 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PREMIUM_REWARDS.map(reward => (
          <motion.div
            key={reward.id}
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-lg border ${
              (state.user.coins || 0) >= reward.cost
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
                    variant={(state.user.coins || 0) >= reward.cost ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => handlePurchase(reward)}
                    disabled={isProcessing || (state.user.coins || 0) < reward.cost}
                  >
                    {isProcessing ? t('common.processing') : t('common.purchase')}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* LootBox Animation */}
      {selectedReward && (
        <LootBox
          is_open={showLootBox}
          on_close={handleCloseLootBox}
          rewards={[{
            id: selectedReward.id,
            type: selectedReward.type,
            value: selectedReward.cost,
            name: selectedReward.title,
            description: selectedReward.description,
            amount: 1,
            rarity: selectedReward.rarity,
            metadata: selectedReward.metadata
          }]}
          source="quest"
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
 * Database Integration:
 * - shop_transactions: Records purchase history
 * - user_inventory: Stores acquired items
 * - profiles: Updates user coins
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
 * 
 * Scalability:
 * - Supports multiple reward types
 * - Transaction-based purchase system
 * - Error handling and state recovery
 * - Internationalization support
 */