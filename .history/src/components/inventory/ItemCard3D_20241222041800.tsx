import { motion, useMotionValue, useTransform, AnimationControls, TargetAndTransition } from 'framer-motion';
import { InventoryItem, ItemEffect, ItemRarity } from '../../types/items';
import { ItemIcon } from '../common/ItemIcon';
import { Info, Shield } from 'lucide-react';
import { Button } from '@mui/material';
import { memo, useMemo } from 'react';

// Styles configuration
const RARITY_CONFIG = {
  [ItemRarity.COMMON]: {
    gradient: ['#9CA3AF', '#6B7280'],
    border: '#9ca3af',
    glow: 'rgba(156, 163, 175, 0.3)',
  },
  [ItemRarity.UNCOMMON]: {
    gradient: ['#34D399', '#10B981'],
    border: '#34d399',
    glow: 'rgba(52, 211, 153, 0.3)',
  },
  [ItemRarity.RARE]: {
    gradient: ['#60A5FA', '#3B82F6'],
    border: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.3)',
  },
  [ItemRarity.EPIC]: {
    gradient: ['#A855F7', '#9333EA'],
    border: '#9333ea',
    glow: 'rgba(147, 51, 234, 0.3)',
  },
  [ItemRarity.LEGENDARY]: {
    gradient: ['#F59E0B', '#EF4444'],
    border: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.3)',
  },
} as const;

// Animation configuration
const CARD_ANIMATIONS = {
  hover: {
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: {
    scale: 0.98
  },
  float: {
    y: [0, -4, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
} as const;

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
    bg-white/10
    border border-white/20
    rounded-lg
    ${className}
  `}>
    {children}
  </div>
));

// Memoized effects component
const ItemEffects = memo(({ effects }: { effects?: ItemEffect[] }) => {
  if (!effects?.length) return null;
  
  const renderedEffects = useMemo(() => (
    effects.map((effect, index) => (
      <span key={index}>
        {effect.type}: {effect.value > 0 ? `+${effect.value}` : effect.value}
        {effect.duration ? ` (${effect.duration}s)` : ''}
        {index < effects.length - 1 ? ', ' : ''}
      </span>
    ))
  ), [effects]);

  return (
    <GlassPanel className="flex items-center gap-2 mb-3 text-sm p-2">
      <Info size={16} className="text-white/80" />
      <div className="text-white/90">{renderedEffects}</div>
    </GlassPanel>
  );
});

// Shine effect component
const ShineEffect = memo(() => (
  <motion.div
    className="absolute inset-0 rounded-xl pointer-events-none"
    animate={{
      background: [
        "linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.03) 55%, transparent 100%)",
        "linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.03) 55%, transparent 100%)"
      ],
      backgroundSize: ["200% 200%", "200% 200%"],
      backgroundPosition: ["-200% -200%", "200% 200%"]
    } as TargetAndTransition}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: "linear"
    }}
  />
));

export const ItemCard3D = ({ item, onClick, onEquip, onUnequip, onUse }: ItemCard3DProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  const rarity = item.rarity.toLowerCase() as keyof typeof RARITY_CONFIG;
  const style = RARITY_CONFIG[rarity] || RARITY_CONFIG[ItemRarity.COMMON];
  const [gradientStart, gradientEnd] = style.gradient;

  return (
    <motion.div
      className="relative w-full cursor-pointer perspective-1000"
      style={{ x, y, rotateX, rotateY }}
      variants={CARD_ANIMATIONS}
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
    >
      <div
        className="relative rounded-xl p-4 transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
          border: `1px solid ${style.border}40`,
          boxShadow: `0 0 20px ${style.glow}`
        }}
      >
        {/* Icon Container */}
        <motion.div 
          className="relative h-24 w-full flex justify-center mb-4"
          variants={CARD_ANIMATIONS}
          animate="float"
        >
          <GlassPanel className="w-16 h-16 rounded-full flex items-center justify-center">
            <ItemIcon item={item} size={48} />
          </GlassPanel>
        </motion.div>

        {/* Content */}
        <div className="text-white">
          <div className="text-center mb-3">
            <h3 className="font-bold text-lg mb-1">{item.name}</h3>
            <GlassPanel className="inline-block px-2 py-0.5 text-xs font-medium">
              {item.rarity.toUpperCase()}
            </GlassPanel>
          </div>

          <GlassPanel className="mb-3 p-2">
            <p className="text-sm text-white/90 line-clamp-2">
              {item.description}
            </p>
          </GlassPanel>

          <ItemEffects effects={item.effects} />

          <GlassPanel className="text-sm text-white/80 mb-3 p-2">
            Quantity: {item.quantity}
          </GlassPanel>

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
          <GlassPanel className="absolute top-2 right-2 flex items-center gap-1 text-xs text-white/90 px-2 py-1">
            <Shield size={14} />
            <span>Equipped</span>
          </GlassPanel>
        )}

        <ShineEffect />
      </div>
    </motion.div>
  );
}; 