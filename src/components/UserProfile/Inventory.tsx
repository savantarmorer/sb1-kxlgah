import React from 'react';
import { motion } from 'framer-motion';
import { Package, Star } from 'lucide-react';
import { use_game } from '../../contexts/GameContext';
import { InventoryItem } from '../../types';

export default function Inventory() {
  const { state } = use_game();
  const { inventory = [], backpack = [] } = state.user;

  return (
    <div className="p-4">
      <div className="mb-8">
        <h3 className="font-semibold mb-3 dark:text-white">Equipped Items</h3>
        <div className="space-y-2">
          {backpack.map((item: InventoryItem) => (
            <motion.div
              key={`${item.type}_${item.id}`}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                  <Package className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 className="font-medium dark:text-white">{item.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {item.rarity === 'rare' && (
                  <Star className="w-5 h-5 text-yellow-400" />
                )}
                <button
                  className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                  onClick={() => {/* Implement unequip logic */}}
                >
                  Unequip
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3 dark:text-white">Available Items</h3>
        <div className="space-y-2">
          {inventory
            .filter((item: InventoryItem) => !backpack.some((equipped: InventoryItem) => equipped.id === item.id))
            .map((item: InventoryItem) => (
              <motion.div
                key={`${item.type}_${item.id}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                    <Package className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h4 className="font-medium dark:text-white">{item.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {item.rarity === 'rare' && (
                    <Star className="w-5 h-5 text-yellow-400" />
                  )}
                  <button
                    className="px-3 py-1 text-sm bg-green-100 text-green-600 rounded-md hover:bg-green-200 transition-colors"
                    onClick={() => {/* Implement equip logic */}}
                  >
                    Equip
                  </button>
                </div>
              </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
}