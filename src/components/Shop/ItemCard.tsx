import { motion } from 'framer-motion';
import { GameItem } from '../../types/items';
import { theme } from '../../styles/design-system';

interface ItemCardProps {
  item: GameItem;
  onEdit?: (item: GameItem) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

const getRarityColor = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'common': return 'bg-gray-200 text-gray-800';
    case 'uncommon': return 'bg-green-200 text-green-800';
    case 'rare': return 'bg-blue-200 text-blue-800';
    case 'epic': return 'bg-purple-200 text-purple-800';
    case 'legendary': return 'bg-yellow-200 text-yellow-800';
    default: return 'bg-gray-200 text-gray-800';
  }
};

export function ItemCard({ item, onEdit, onDelete, isLoading }: ItemCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={theme.animation.spring}
      className="group relative overflow-hidden rounded-xl bg-surface-light dark:bg-surface-dark
                 border border-gray-200 dark:border-gray-800 hover:border-primary-500
                 transition-colors duration-200"
    >
      <div className="aspect-square overflow-hidden">
        <motion.img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.05 }}
          transition={theme.animation.transition}
        />
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg">{item.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {item.description}
        </p>
        
        <div className="flex items-center justify-between mt-4">
          <span className="text-primary-600 dark:text-primary-400 font-medium">
            {item.cost} Coins
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium
                          ${getRarityColor(item.rarity)}`}>
            {item.rarity}
          </span>
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100
                      transition-opacity duration-200">
          {/* Action buttons */}
        </div>
      )}
    </motion.div>
  );
} 