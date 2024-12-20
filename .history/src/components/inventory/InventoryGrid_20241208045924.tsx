import { motion, AnimatePresence } from 'framer-motion';
import { ItemCard3D } from './ItemCard3D';
import { GameItem } from '@/types/items';
import { useState } from 'react';

interface InventoryGridProps {
  items: GameItem[];
  onEquip?: (item: GameItem) => void;
}

export const InventoryGrid = ({ items, onEquip }: InventoryGridProps) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rarity');

  const categories = ['all', 'weapon', 'armor', 'accessory', 'consumable'];
  
  const filteredItems = items.filter(item => 
    selectedCategory === 'all' || item.type === selectedCategory
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'rarity') {
      return b.rarity.localeCompare(a.rarity);
    }
    return b.level_requirement - a.level_requirement;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${selectedCategory === category 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 
                     hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 text-sm"
        >
          <option value="rarity">Sort by Rarity</option>
          <option value="level">Sort by Level</option>
        </select>
      </div>

      {/* Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        layout
      >
        <AnimatePresence mode="popLayout">
          {sortedItems.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <ItemCard3D 
                item={item}
                onClick={() => onEquip?.(item)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}; 