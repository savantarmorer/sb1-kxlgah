import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { GameItem } from '../../types/items';
import { Box, Typography } from '@mui/material';

interface ItemCard3DProps {
  item: GameItem;
  onClick?: () => void;
  isEquipped?: boolean;
}

const rarityGradients = {
  common: 'from-neutral-400 to-neutral-600',
  uncommon: 'from-green-400 to-green-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-yellow-600'
};

const rarityColors = {
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800'
};

export const ItemCard3D = ({ item, onClick, isEquipped }: ItemCard3DProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Transform mouse movement to rotation
  const rotateX = useTransform(y, [-100, 100], [30, -30]);
  const rotateY = useTransform(x, [-100, 100], [-30, 30]);

  // Add spring physics
  const springConfig = { damping: 25, stiffness: 300 };
  const scaleSpring = useSpring(1, springConfig);

  return (
    <motion.div
      style={{
        x,
        y,
        rotateX,
        rotateY,
        scale: scaleSpring,
      }}
      whileHover={{ scale: 1.1 }}
      drag
      dragElastic={0.1}
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={onClick}
      className="relative perspective-1000 cursor-pointer"
    >
      <Box
        sx={{
          width: '12rem',
          height: '16rem',
          position: 'relative',
          transformStyle: 'preserve-3d',
          borderRadius: 2,
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${rarityColors[item.rarity]}20, ${rarityColors[item.rarity]}40)`,
          boxShadow: 3,
          border: '1px solid',
          borderColor: `${rarityColors[item.rarity]}30`,
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Item Image */}
        <Box
          sx={{
            height: '8rem',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {item.icon && (
            <Box
              component="img"
              src={item.icon}
              alt={item.name}
              sx={{
                height: '6rem',
                width: '6rem',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
              }}
            />
          )}
          {/* Glow Effect */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, transparent, rgba(255,255,255,0.1))',
            }}
          />
        </Box>

        {/* Item Info */}
        <Box sx={{ p: 2, color: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            {item.name}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
            {item.description}
          </Typography>

          {/* Effects */}
          {Array.isArray(item.effects) && item.effects.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {item.effects.map((effect, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    mb: 0.5,
                  }}
                >
                  <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                    {effect.type}
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    +{effect.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Equipment Status */}
        {isEquipped && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'success.main',
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            Equipped
          </Box>
        )}

        {/* Reflection Effect */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, transparent, rgba(255,255,255,0.05))',
            borderRadius: 2,
          }}
        />
      </Box>
    </motion.div>
  );
};

/**
 * ItemCard3D Component
 * 
 * Purpose:
 * - Provides a 3D interactive card for special items
 * - Used for legendary/special items display
 * - Enhanced visual presentation
 * 
 * Props:
 * - item: GameItem object
 * - onClick: Optional click handler
 * - isEquipped: Whether item is equipped
 * 
 * Features:
 * - 3D rotation effects
 * - Interactive animations
 * - Drag functionality
 * - Rarity-based styling
 * - Equipment status
 * 
 * Used By:
 * - Inventory system
 * - Special shop displays
 * - Achievement rewards
 * 
 * Dependencies:
 * - Framer Motion
 * - Material-UI
 * - GameItem type
 */ 