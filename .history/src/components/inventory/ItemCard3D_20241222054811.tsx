import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { InventoryItem, ItemEffect, ItemRarity } from '../../types/items';
import { ItemIcon } from '../common/ItemIcon';
import { Info, Package } from 'lucide-react';
import { Button, Box } from '@mui/material';

interface ItemCard3DProps {
  item: InventoryItem;
  onClick?: () => void;
}

export const ItemCard3D = ({ item, onClick }: ItemCard3DProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Transform mouse movement to rotation
  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);

  // Add spring physics
  const springConfig = { damping: 30, stiffness: 350 };
  const scaleSpring = useSpring(1, springConfig);

  // Rarity-based styling
  const rarityStyles = {
    [ItemRarity.COMMON]: {
      gradient: 'from-neutral-400 via-neutral-500 to-neutral-600',
      glow: 'rgba(156, 163, 175, 0.5)',
      border: 'rgba(156, 163, 175, 0.3)',
    },
    [ItemRarity.UNCOMMON]: {
      gradient: 'from-green-400 via-green-500 to-green-600',
      glow: 'rgba(52, 211, 153, 0.5)',
      border: 'rgba(52, 211, 153, 0.3)',
    },
    [ItemRarity.RARE]: {
      gradient: 'from-blue-400 via-blue-500 to-blue-600',
      glow: 'rgba(59, 130, 246, 0.5)',
      border: 'rgba(59, 130, 246, 0.3)',
    },
    [ItemRarity.EPIC]: {
      gradient: 'from-purple-400 via-purple-500 to-purple-600',
      glow: 'rgba(147, 51, 234, 0.5)',
      border: 'rgba(147, 51, 234, 0.3)',
    },
    [ItemRarity.LEGENDARY]: {
      gradient: 'from-yellow-400 via-orange-500 to-red-600',
      glow: 'rgba(245, 158, 11, 0.5)',
      border: 'rgba(245, 158, 11, 0.3)',
    },
  };

  const rarity = item.rarity.toLowerCase() as keyof typeof rarityStyles;
  const style = rarityStyles[rarity] || rarityStyles[ItemRarity.COMMON];

  const renderEffectValue = (effect: ItemEffect) => {
    if (typeof effect.value === 'number') {
      return effect.value > 0 ? `+${effect.value}` : effect.value.toString();
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
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => {}}
      onHoverEnd={() => {}}
      drag
      dragElastic={0.1}
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={onClick}
      className="relative w-full cursor-pointer"
    >
      <div className="relative w-full h-full transform-gpu">
        {/* Background Glow */}
        <div 
          className="absolute inset-0 rounded-2xl blur-xl opacity-50 -z-10"
          style={{ 
            background: `radial-gradient(circle at center, ${style.glow} 0%, transparent 70%)`,
            transform: "translateZ(-10px)"
          }}
        />

        {/* Card Face */}
        <motion.div 
          className={`relative rounded-xl bg-gradient-to-br ${style.gradient}
            shadow-lg backdrop-blur-sm border p-4 h-full
            transform-gpu transition-all duration-300`}
          style={{
            borderColor: style.border,
            boxShadow: `0 0 20px ${style.glow}`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Item Icon with Floating Effect */}
          <motion.div 
            className="relative h-28 w-full flex items-center justify-center mb-4"
            animate={{ 
              y: [0, -8, 0],
              rotateZ: [-2, 2, -2]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="w-20 h-20 rounded-full bg-black/30 flex items-center justify-center backdrop-blur-xl
                          shadow-xl border border-white/20 transform-gpu hover:scale-110 transition-transform">
              <ItemIcon item={item} size={64} />
            </div>
          </motion.div>

          {/* Content Container */}
          <div className="text-white transform-gpu" style={{ transform: "translateZ(20px)" }}>
            {/* Name and Rarity */}
            <div className="text-center mb-4">
              <h3 className="font-bold text-xl mb-2 text-white drop-shadow-lg">
                {item.name}
              </h3>
              <span className="px-3 py-1 bg-black/30 rounded-full text-sm font-semibold
                           border border-white/20 shadow-lg backdrop-blur-sm">
                {item.rarity.toUpperCase()}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-white/90 mb-4 line-clamp-3 backdrop-blur-sm
                       bg-black/20 p-2 rounded-lg border border-white/10">
              {item.description}
            </p>
            
            {/* Effects */}
            {item.effects && item.effects.length > 0 && (
              <div className="flex items-center gap-2 mb-4 text-sm bg-black/20
                           p-2 rounded-lg border border-white/10 backdrop-blur-sm">
                <Info size={16} className="text-white/80" />
                <div className="text-white/90">
                  {item.effects.map((effect: ItemEffect, index: number) => (
                    <span key={index} className="effect-text">
                      {effect.type}: {renderEffectValue(effect)}
                      {effect.duration ? ` (${effect.duration}s)` : ''}
                      {index < item.effects.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="text-sm text-white/80 mb-4 bg-black/20 p-2 rounded-lg
                         border border-white/10 backdrop-blur-sm">
              Quantity: {item.quantity}
            </div>
          </div>

          {/* Equipment Status */}
          {item.equipped && (
            <div className="absolute top-3 right-3 bg-green-500/80 px-3 py-1 rounded-lg
                         text-sm font-bold backdrop-blur-sm border border-white/20 shadow-lg
                         transform-gpu" style={{ transform: "translateZ(30px)" }}>
              Equipped
            </div>
          )}

          {/* Shine Effect */}
          <div className="absolute inset-0 rounded-xl opacity-20 mix-blend-overlay
                       bg-gradient-to-tr from-transparent via-white to-transparent" />
        </motion.div>
      </div>
    </motion.div>
  );
}; 