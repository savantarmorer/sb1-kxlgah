import React from 'react';
import { LootBox } from './Rewards/LootBox';
import type { Reward } from '../types/rewards';

interface LootboxManagerProps {
  is_open: boolean;
  on_close: () => Promise<void>;
  rewards: Reward[];
}

export default function LootboxManager({ is_open, on_close, rewards }: LootboxManagerProps) {
  const handleClaim = async () => {
    // Handle the claimed rewards here
    await on_close();
  };

  return (
    <LootBox
      is_open={is_open}
      on_close={on_close}
      rewards={rewards}
      on_claim={handleClaim}
    />
  );
} 