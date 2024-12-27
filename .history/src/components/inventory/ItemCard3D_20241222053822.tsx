import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { InventoryItem, ItemEffect, ItemRarity, ItemType } from '../../types/items';
import { ItemIcon } from '../common/ItemIcon';
import { Info, Shield } from 'lucide-react';
import { Button } from '@mui/material';
import { memo, useMemo } from 'react';

// Styles configuration
const RARITY_CONFIG = {
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
} as const;

// Animation configuration
const HOVER_ANIMATION = {
  scale: 1.05,
  transition: {
    type: "spring",
    stiffness: 400,
    damping: 25
  }
};

const TAP_ANIMATION = {
  scale: 0.95
};

const FLOAT_ANIMATION = {
  y: [0, -8, 0],
  rotateZ: [-2, 2, -2],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

interface ItemCard3DProps {
  item: InventoryItem;
  onClick?: () => void;
  onEquip?: (item: InventoryItem) => void;
  onUnequip?: (item: InventoryItem) => void;
  onUse?: (item: InventoryItem) => void;
}

// Glass panel component for consistent styling
const GlassPanel = memo(({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`
    backdrop-blur-sm
    bg-black/20
    border border-white/10
    shadow-lg
    ${className}
  `}>
    {children}
  </div>
));

// Memoized effects component
const ItemEffects = memo(({ effects }: { effects?: ItemEffect[] }) => {
  if (!effects?.length) return null;
  
  const renderEffectValue = (effect: ItemEffect) => {
    if (typeof effect.value === 'number') {
      return effect.value > 0 ? `+${effect.value}` : effect.value.toString();
    }
    return JSON.stringify(effect.value);
  };

  const renderedEffects = useMemo(() => (
    effects.map((effect, index) => (
      <span key={index} className="effect-text">
        {effect.type}: {renderEffectValue(effect)}
        {effect.duration ? ` (${effect.duration}s)` : ''}
        {index < effects.length - 1 ? ', ' : ''}
      </span>
    ))
  ), [effects]);

  return (
    <GlassPanel className="flex items-center gap-2 mb-4 text-sm p-2 rounded-lg">
      <Info size={16} className="text-white/80" />
      <div className="text-white/90">{renderedEffects}</div>
    </GlassPanel>
  );
});

export const ItemCard3D = ({ item, onClick, onEquip, onUnequip, onUse }: ItemCard3DProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Transform mouse movement to rotation
  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);

  // Add spring physics
  const springConfig = { damping: 30, stiffness: 350 };
  const scaleSpring = useSpring(1, springConfig);

  const rarity = item.rarity.toLowerCase() as keyof typeof RARITY_CONFIG;
  const style = RARITY_CONFIG[rarity] || RARITY_CONFIG[ItemRarity.COMMON];

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
      whileHover={HOVER_ANIMATION}
      whileTap={TAP_ANIMATION}
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
            animate={FLOAT_ANIMATION}
            style={{ transformStyle: "preserve-3d" }}
          >
            <GlassPanel className="w-20 h-20 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
              <ItemIcon item={item} size={64} />
            </GlassPanel>
          </motion.div>

          {/* Content Container */}
          <div className="text-white transform-gpu" style={{ transform: "translateZ(20px)" }}>
            {/* Name and Rarity */}
            <div className="text-center mb-4">
              <h3 className="font-bold text-xl mb-2 text-white drop-shadow-lg">
                {item.name}
              </h3>
              <GlassPanel className="inline-block px-3 py-1 rounded-full text-sm font-semibold">
                {item.rarity.toUpperCase()}
              </GlassPanel>
            </div>

            {/* Description */}
            <GlassPanel className="mb-4 rounded-lg">
              <p className="text-sm text-white/90 line-clamp-3 p-2">
                {item.description}
              </p>
            </GlassPanel>

            {/* Effects */}
            {item.effects && <ItemEffects effects={item.effects} />}

            {/* Quantity */}
            <GlassPanel className="text-sm text-white/80 mb-4 p-2 rounded-lg">
              Quantity: {item.quantity}
            </GlassPanel>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              {item.type === ItemType.CONSUMABLE ? (
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
            <GlassPanel className="absolute top-3 right-3 px-3 py-1 rounded-lg text-sm font-bold transform-gpu" 
              style={{ transform: "translateZ(30px)" }}>
              <div className="flex items-center gap-1">
                <Shield size={14} />
                <span>Equipped</span>
              </div>
            </GlassPanel>
          )}

          {/* Shine Effect */}
          <div className="absolute inset-0 rounded-xl opacity-20 mix-blend-overlay
                       bg-gradient-to-tr from-transparent via-white to-transparent" />
        </motion.div>
      </div>
    </motion.div>
  );
}; 