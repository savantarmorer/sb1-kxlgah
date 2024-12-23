import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Crown, Coins } from 'lucide-react';
import { useTitles } from '../../hooks/useTitles';
import { useGame } from '../../contexts/GameContext';

interface TitleCardProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  rarity: string;
  isOwned: boolean;
  isEquipped: boolean;
  onPurchase: () => void;
  onEquip: () => void;
  metadata?: {
    color?: string;
  };
}

const TitleCard: React.FC<TitleCardProps> = ({
  name,
  description,
  price,
  rarity,
  isOwned,
  isEquipped,
  onPurchase,
  onEquip,
  metadata
}) => {
  const rarityColors = {
    common: 'bg-gray-100 dark:bg-gray-800',
    rare: 'bg-blue-100 dark:bg-blue-900',
    epic: 'bg-purple-100 dark:bg-purple-900',
    legendary: 'bg-yellow-100 dark:bg-yellow-900'
  };

  const textColors = {
    common: 'text-gray-900 dark:text-gray-100',
    rare: 'text-blue-900 dark:text-blue-100',
    epic: 'text-purple-900 dark:text-purple-100',
    legendary: 'text-yellow-900 dark:text-yellow-100'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`
        relative p-4 rounded-lg shadow-md
        ${rarityColors[rarity as keyof typeof rarityColors]}
        ${isEquipped ? 'ring-2 ring-primary-500' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className={`text-lg font-bold ${textColors[rarity as keyof typeof textColors]}`}>
            {name}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isOwned ? (
            <Unlock className="w-5 h-5 text-green-500" />
          ) : (
            <Lock className="w-5 h-5 text-red-500" />
          )}
          {isEquipped && (
            <Crown className="w-5 h-5 text-yellow-500" />
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center">
        {!isOwned && (
          <div className="flex items-center space-x-1">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">{price}</span>
          </div>
        )}
        <div className="flex space-x-2">
          {!isOwned ? (
            <button
              onClick={onPurchase}
              className="px-3 py-1 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors"
            >
              Purchase
            </button>
          ) : !isEquipped ? (
            <button
              onClick={onEquip}
              className="px-3 py-1 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors"
            >
              Equip
            </button>
          ) : (
            <span className="px-3 py-1 text-sm font-medium text-green-500 bg-green-100 dark:bg-green-900 dark:text-green-100 rounded-md">
              Equipped
            </span>
          )}
        </div>
      </div>

      {metadata?.color && (
        <div
          className="absolute top-2 right-2 w-4 h-4 rounded-full"
          style={{ backgroundColor: metadata.color }}
        />
      )}
    </motion.div>
  );
};

export default function TitleSelector() {
  const { state } = useGame();
  const {
    titles,
    loading,
    purchaseTitle,
    equipTitle,
    unequipTitle,
    isOwned,
    isEquipped
  } = useTitles();

  if (loading || !state.user) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const rarityOrder = {
    legendary: 0,
    epic: 1,
    rare: 2,
    common: 3
  };

  const sortedTitles = [...titles].sort((a, b) => {
    const rarityDiff = rarityOrder[a.rarity as keyof typeof rarityOrder] - 
                      rarityOrder[b.rarity as keyof typeof rarityOrder];
    if (rarityDiff !== 0) return rarityDiff;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Display Titles
        </h2>
        <button
          onClick={() => unequipTitle()}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Reset to Default
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedTitles.map((title) => (
          <TitleCard
            key={title.id}
            id={title.id}
            name={title.name}
            description={title.description}
            price={title.price}
            rarity={title.rarity}
            isOwned={isOwned(title.id)}
            isEquipped={isEquipped(title.id)}
            onPurchase={() => purchaseTitle(title.id, title.price)}
            onEquip={() => equipTitle(title.id)}
            metadata={title.metadata}
          />
        ))}
      </div>
    </div>
  );
} 