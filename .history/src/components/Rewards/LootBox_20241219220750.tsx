import React, { useState } from 'react';
import Button from '../Button';
import { Modal as BaseModal } from '../Modal';
import { useInventory } from '../../hooks/useInventory';
import { Reward } from '../../types/rewards';
import { ConfettiEffect } from '../Effects/ConfettiEffect';
import { Achievement } from '../../types/achievements';
import type { ItemType, ItemRarity } from '../../types/items';
import { Swords } from 'lucide-react';

export interface LootBoxProps {
  is_open: boolean;
  on_close: () => void;
  rewards: Reward[];
  on_claim: (rewards: Reward[]) => void;
}

export const LootBox: React.FC<LootBoxProps> = ({
  is_open,
  on_close,
  rewards,
  on_claim
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const { addItem } = useInventory();

  const handleClaim = async () => {
    setShowConfetti(true);
    if (rewards.length > 0) {
      for (const reward of rewards) {
        const gameItem = {
          id: reward.id,
          name: reward.name,
          type: reward.type as ItemType,
          quantity: 1,
          equipped: false,
          acquired_at: new Date().toISOString(),
          effects: [],
          stats: {},
          value: reward.value,
          description: reward.description,
          rarity: reward.rarity as ItemRarity,
          cost: reward.value || 0,
          imageUrl: '',
          is_active: true
        };
        await addItem(gameItem, 1, 0);
      }
      on_claim(rewards);
    }
    
    // Auto close after confetti
    setTimeout(() => {
      on_close();
    }, 3000);
  };

  const handleClose = () => {
    on_close();
  };

  if (!is_open) return null;

  return (
    <>
      {showConfetti && <ConfettiEffect duration={3000} />}
      <BaseModal is_open={is_open} on_close={handleClose}>
        <div className="flex flex-col items-center p-6 space-y-4">
          <h2 className="text-2xl font-bold text-center">Recompensas!</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
            {rewards.map((reward, index) => (
              <div 
                key={index}
                className="flex items-center p-3 bg-gray-100 rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{reward.name}</h3>
                  <p className="text-sm text-gray-600">{reward.description}</p>
                </div>
                <div className="ml-2 text-lg font-bold">
                  {reward.amount > 1 && `x${reward.amount}`}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-6">
            <Button onClick={handleClaim}>
              Coletar Recompensas
            </Button>
          </div>
        </div>
      </BaseModal>
    </>
  );
};

const createLegendaryAchievement = (): Achievement => ({
  id: 'legendary_reward',
  title: 'Legendary Fortune',
  description: 'Obtain a legendary reward',
  category: 'rewards',
  icon: Swords,
  points: 100,
  rarity: 'legendary',
  trigger_conditions: [{
    type: 'reward_rarity',
    value: 4,
    comparison: 'eq'
  }],
  unlocked: true,
  total: 1,
  completed: true,
  claimed: false,
  order_num: 100,
  progress: 100,
  prerequisites: [],
  dependents: []
});

export default LootBox;

