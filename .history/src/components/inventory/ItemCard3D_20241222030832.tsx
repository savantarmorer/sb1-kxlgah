import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { GameItem, ItemEffect } from '@/types/items';
import { ItemIcon } from '../common/ItemIcon';
import { Info } from 'lucide-react';

interface ItemCard3DProps {
  item: GameItem;
  onClick?: () => void;
}

export const ItemCard3D = ({ item, onClick }: ItemCard3DProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Transform mouse movement to rotation
  const rotateX = useTransform(y, [-100, 100], [30, -30]);
  const rotateY = useTransform(x, [-100, 100], [-30, 30]);

  // Add spring physics
  const springConfig = { damping: 25, stiffness: 300 };
  const scaleSpring = useSpring(1, springConfig);

  // Rarity colors
  const rarityGradients = {
    common: 'from-neutral-400 to-neutral-600',
    uncommon: 'from-green-400 to-green-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-yellow-600',
  };

  const renderEffectValue = (effect: ItemEffect) => {
    if (typeof effect.value === 'number') {
      return effect.value.toString();
    }
    return JSON.stringify(effect.value);
  };

  return (
    <motion.div
      style={{
        x,
        y,
        rotateX,
        rotateY,
        scale: scaleSpring,
      }}
      whileHover={{ scale: 1.05 }}
      drag
      dragElastic={0.1}
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={onClick}
      className="relative perspective-1000 cursor-pointer"
    >
      <div className="w-full h-full relative preserve-3d">
        {/* Card Face */}
        <motion.div 
          className={`absolute inset-0 rounded-xl bg-gradient-to-br ${rarityGradients[item.rarity]} 
            shadow-lg backdrop-blur-sm border border-white/20 p-4`}
        >
          {/* Item Icon */}
          <div className="relative h-24 w-full flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <ItemIcon item={item} size={48} />
            </div>
          </div>

          {/* Item Info */}
          <div className="text-white">
            {/* Name and Rarity */}
            <div className="text-center mb-4">
              <h3 className="font-bold text-lg mb-2">{item.name}</h3>
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-semibold">
                {item.rarity.toUpperCase()}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm opacity-80 mb-4 line-clamp-3">{item.description}</p>
            
            {/* Effects */}
            {item.effects && item.effects.length > 0 && (
              <div className="flex items-center gap-2 mb-4 text-sm opacity-80">
                <Info size={16} />
                <div>
                  {item.effects.map((effect: ItemEffect, index: number) => (
                    <span key={index}>
                      {effect.type}: {renderEffectValue(effect)}
                      {effect.duration ? ` (${effect.duration}s)` : ''}
                      {index < item.effects.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            {'quantity' in item && (
              <div className="text-sm opacity-80 mb-4">
                Quantity: {(item as any).quantity}
              </div>
            )}

            {/* Equipment Status */}
            {'equipped' in item && (item as any).equipped && (
              <div className="absolute top-2 right-2 bg-green-500/80 px-2 py-1 rounded text-xs font-bold backdrop-blur-sm">
                Equipped
              </div>
            )}
          </div>
        </motion.div>

        {/* Reflection Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent rounded-xl pointer-events-none" />
      </div>
    </motion.div>
  );
}; 