import { motion, useMotionValue, useTransform } from 'framer-motion';
import { InventoryItem, ItemEffect, ItemRarity } from '../../types/items';
import { ItemIcon } from '../common/ItemIcon';
import { Info, Shield } from 'lucide-react';
import { Button } from '@mui/material';

interface ItemCard3DProps {
  item: InventoryItem;
  onClick?: () => void;
  onEquip?: (item: InventoryItem) => void;
  onUnequip?: (item: InventoryItem) => void;
  onUse?: (item: InventoryItem) => void;
}

// Separate component for effects list
const ItemEffects = ({ effects }: { effects?: ItemEffect[] }) => {
  if (!effects?.length) return null;
  
  return (
    <div className="flex items-center gap-2 mb-3 text-sm bg-black/10 p-2 rounded-lg">
      <Info size={16} className="text-white/80" />
      <div className="text-white/90">
        {effects.map((effect, index) => (
          <span key={index}>
            {effect.type}: {effect.value > 0 ? `+${effect.value}` : effect.value}
            {effect.duration ? ` (${effect.duration}s)` : ''}
            {index < effects.length - 1 ? ', ' : ''}
          </span>
        ))}
      </div>
    </div>
  );
};

// Rarity-based styling configuration
const rarityConfig = {
  [ItemRarity.COMMON]: {
    gradient: 'from-neutral-400 to-neutral-600',
    border: '#9ca3af',
  },
  [ItemRarity.UNCOMMON]: {
    gradient: 'from-green-400 to-green-600',
    border: '#34d399',
  },
  [ItemRarity.RARE]: {
    gradient: 'from-blue-400 to-blue-600',
    border: '#3b82f6',
  },
  [ItemRarity.EPIC]: {
    gradient: 'from-purple-400 to-purple-600',
    border: '#9333ea',
  },
  [ItemRarity.LEGENDARY]: {
    gradient: 'from-yellow-400 to-red-600',
    border: '#f59e0b',
  },
};

export const ItemCard3D = ({ item, onClick, onEquip, onUnequip, onUse }: ItemCard3DProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  const rarity = item.rarity.toLowerCase() as keyof typeof rarityConfig;
  const style = rarityConfig[rarity] || rarityConfig[ItemRarity.COMMON];

  return (
    <motion.div
      className="relative w-full cursor-pointer perspective-1000"
      style={{ x, y, rotateX, rotateY }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => {}}
      onHoverEnd={() => {}}
      onClick={onClick}
    >
      <div className={`
        relative rounded-xl bg-gradient-to-br ${style.gradient}
        p-4 transition-all duration-300
        animate-gradient-shift
      `}
      style={{
        border: `1px solid ${style.border}40`,
        boxShadow: `0 0 20px ${style.border}20`,
      }}>
        {/* Icon Container */}
        <motion.div 
          className="relative h-24 w-full flex justify-center mb-4"
          animate={{ y: [0, -4, 0] }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-16 h-16 rounded-full bg-black/20 flex items-center justify-center backdrop-blur-sm">
            <ItemIcon item={item} size={48} />
          </div>
        </motion.div>

        {/* Content */}
        <div className="text-white">
          <div className="text-center mb-3">
            <h3 className="font-bold text-lg mb-1">{item.name}</h3>
            <span className="px-2 py-0.5 bg-black/20 rounded-full text-xs font-medium">
              {item.rarity.toUpperCase()}
            </span>
          </div>

          <p className="text-sm text-white/90 mb-3 line-clamp-2">
            {item.description}
          </p>

          <ItemEffects effects={item.effects} />

          <div className="text-sm text-white/80 mb-3">
            Quantity: {item.quantity}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            {item.type === 'CONSUMABLE' ? (
              <Button
                fullWidth
                variant="contained"
                onClick={(e) => {
                  e.stopPropagation();
                  onUse?.(item);
                }}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Use
              </Button>
            ) : (
              item.equipped ? (
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnequip?.(item);
                  }}
                  className="border-white/30 text-white"
                >
                  Unequip
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEquip?.(item);
                  }}
                  className="bg-indigo-500 hover:bg-indigo-600"
                >
                  Equip
                </Button>
              )
            )}
          </div>
        </div>

        {/* Equipment Status */}
        {item.equipped && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-white/90">
            <Shield size={14} />
            <span>Equipped</span>
          </div>
        )}

        {/* Subtle shine effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
      </div>
    </motion.div>
  );
}; 