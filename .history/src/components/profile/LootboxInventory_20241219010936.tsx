import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Star } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import Button from '../Button';
import LootBox from '../Rewards/LootBox';
import type { Reward, RewardRarity } from '../../types/rewards';

interface LootboxItem {
  id: string;
  type: 'lootbox';
  rarity: RewardRarity;
  rewards: Reward[];
}

interface InventoryItem extends LootboxItem {
  name: string;
  description: string;
  value: number;
  amount: number;
}

export default function LootboxInventory() {
  const { state } = useGame();
  const [selectedLootbox, setSelectedLootbox] = useState<LootboxItem | null>(null);
  const [isLootboxOpen, setIsLootboxOpen] = useState(false);

  // Get lootboxes from game state
  const lootboxes = (state.user?.inventory as InventoryItem[] || [])
    .filter((item): item is InventoryItem => item.type === 'lootbox');

  const rarityColors: Record<RewardRarity, string> = {
    common: 'gray',
    rare: 'blue',
    epic: 'purple',
    legendary: 'yellow'
  };

  const handleOpenLootbox = (lootbox: InventoryItem) => {
    setSelectedLootbox(lootbox);
    setIsLootboxOpen(true);
  };

  const handleClaimRewards = (rewards: Reward[]) => {
    // Handle claiming rewards logic here
    setIsLootboxOpen(false);
    setSelectedLootbox(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6 dark:text-white">Your Lootboxes</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {lootboxes.map((lootbox) => (
            <motion.div
              key={lootbox.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-2 ${
                lootbox.rarity === 'legendary' ? 'border-yellow-500/30' :
                lootbox.rarity === 'epic' ? 'border-purple-500/30' :
                lootbox.rarity === 'rare' ? 'border-blue-500/30' :
                'border-gray-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${
                    lootbox.rarity === 'legendary' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                    lootbox.rarity === 'epic' ? 'bg-purple-100 dark:bg-purple-900/30' :
                    lootbox.rarity === 'rare' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    'bg-gray-100 dark:bg-gray-900/30'
                  }`}>
                    <Gift className={`w-6 h-6 text-${rarityColors[lootbox.rarity]}-500`} />
                  </div>
                  <div>
                    <h3 className="font-semibold dark:text-white">
                      {lootbox.rarity.charAt(0).toUpperCase() + lootbox.rarity.slice(1)} Lootbox
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Contains {lootbox.rewards?.length || 'mystery'} items
                    </p>
                  </div>
                </div>
                <Star className={`w-5 h-5 text-${rarityColors[lootbox.rarity]}-500`} />
              </div>
              
              <Button
                variant="primary"
                onClick={() => handleOpenLootbox(lootbox)}
                className="w-full"
              >
                Open Lootbox
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {lootboxes.length === 0 && (
        <div className="text-center py-8">
          <Gift className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No lootboxes available</p>
        </div>
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