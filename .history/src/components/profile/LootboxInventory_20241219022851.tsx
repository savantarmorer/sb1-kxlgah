import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Star, Sparkles } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import Button from '../Button';
import LootBox from '../Rewards/LootBox';
import type { Reward, RewardRarity } from '../../types/rewards';
import { supabase } from '../../lib/supabase';

interface LootboxItem {
  id: string;
  type: 'lootbox';
  rarity: RewardRarity;
  rewards: Reward[];
  name: string;
  description: string;
  value: number;
  amount: number;
}

const rarityGradients = {
  common: 'from-gray-400 to-gray-500',
  rare: 'from-blue-400 to-blue-500',
  epic: 'from-purple-400 to-purple-500',
  legendary: 'from-yellow-400 to-yellow-500'
};

const rarityGlow = {
  common: 'shadow-gray-500/50',
  rare: 'shadow-blue-500/50',
  epic: 'shadow-purple-500/50',
  legendary: 'shadow-yellow-500/50'
};

export default function LootboxInventory() {
  const { state } = useGame();
  const [selectedLootbox, setSelectedLootbox] = useState<LootboxItem | null>(null);
  const [isLootboxOpen, setIsLootboxOpen] = useState(false);

  // Get lootboxes from game state's pending_lootboxes
  const lootboxes = state.user?.pending_lootboxes || [];

  const handleOpenLootbox = async (lootbox: LootboxItem) => {
    setSelectedLootbox(lootbox);
    setIsLootboxOpen(true);

    // Mark lootbox as claimed in the database
    try {
      const { error } = await supabase
        .from('pending_lootboxes')
        .update({ is_claimed: true, claimed_at: new Date().toISOString() })
        .eq('id', lootbox.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error claiming lootbox:', error);
      // You might want to show an error notification here
    }
  };

  const handleClaimRewards = async (rewards: Reward[]) => {
    if (!selectedLootbox) return;

    try {
      // Add rewards to user's inventory/currency
      for (const reward of rewards) {
        if (reward.type === 'xp' || reward.type === 'coins') {
          const { error } = await supabase
            .from('profiles')
            .update({
              [reward.type]: supabase.sql`${reward.type} + ${reward.value}`
            })
            .eq('id', state.user?.id);

          if (error) throw error;
        } else if (reward.type === 'item') {
          const { error } = await supabase
            .from('user_inventory')
            .insert({
              user_id: state.user?.id,
              item_id: reward.id,
              quantity: reward.amount || 1,
              acquired_at: new Date().toISOString()
            });

          if (error) throw error;
        }
      }
    } catch (error) {
      console.error('Error processing rewards:', error);
      // You might want to show an error notification here
    }

    setIsLootboxOpen(false);
    setSelectedLootbox(null);
  };

  return (
    <div className="space-y-6 p-6">
      <motion.h2 
        className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Your Lootboxes
      </motion.h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {lootboxes.map((lootbox) => (
            <motion.div
              key={lootbox.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${rarityGradients[lootbox.rarity]} p-[2px]`}
            >
              <div className="relative h-full bg-gray-900 rounded-2xl p-6 backdrop-blur-xl">
                <motion.div 
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  animate={{ 
                    backgroundPosition: ['0% 0%', '100% 100%'],
                    backgroundSize: ['100% 100%', '200% 200%']
                  }}
                  transition={{ 
                    duration: 10, 
                    repeat: Infinity,
                    repeatType: 'reverse'
                  }}
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)'
                  }}
                />
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${rarityGradients[lootbox.rarity]} shadow-lg ${rarityGlow[lootbox.rarity]}`}>
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">
                        {lootbox.rarity.charAt(0).toUpperCase() + lootbox.rarity.slice(1)} Lootbox
                      </h3>
                      <p className="text-sm text-gray-300">
                        Contains {lootbox.rewards?.length || 'mystery'} items
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Star className={`w-5 h-5 text-${lootbox.rarity === 'legendary' ? 'yellow' : lootbox.rarity === 'epic' ? 'purple' : lootbox.rarity === 'rare' ? 'blue' : 'gray'}-400`} />
                  </motion.div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="primary"
                    onClick={() => handleOpenLootbox(lootbox)}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Open Lootbox
                  </Button>
                </motion.div>

                <motion.div
                  className="absolute -top-12 -right-12 w-24 h-24 opacity-20"
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, repeatType: "reverse" }
                  }}
                >
                  <Sparkles className="w-full h-full" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {lootboxes.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <Gift className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-400 text-lg">No lootboxes available</p>
        </motion.div>
      )}

      {selectedLootbox && (
        <LootBox
          is_open={isLootboxOpen}
          on_close={() => setIsLootboxOpen(false)}
          rewards={selectedLootbox.rewards}
          on_claim={handleClaimRewards}
        />
      )}
    </div>
  );
} 