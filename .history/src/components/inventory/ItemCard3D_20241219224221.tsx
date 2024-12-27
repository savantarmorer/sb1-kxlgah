import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { GameItem } from '@/types/items';

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
      <div className="w-48 h-64 relative preserve-3d">
        {/* Card Face */}
        <motion.div 
          className={`absolute inset-0 rounded-xl bg-gradient-to-br ${rarityGradients[item.rarity]} 
            shadow-lg backdrop-blur-sm border border-white/20`}
        >
          {/* Item Image */}
          <div className="relative h-32 w-full flex items-center justify-center">
            <img 
              src={item.imageUrl} 
              alt={item.name}
              className="h-24 w-24 object-contain drop-shadow-lg"
            />
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
          </div>

          {/* Item Info */}
          <div className="p-4 text-white">
            <h3 className="font-bold text-lg">{item.name}</h3>
            <p className="text-sm opacity-80">{item.description}</p>
            
            {/* Stats */}
            <div className="mt-2 space-y-1">
              {Object.entries(item.stats).map(([stat, value]) => (
                <div key={stat} className="flex justify-between text-xs">
                  <span className="capitalize">{stat}</span>
                  <span className="font-mono">+{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Equipment Status */}
          {item.isEquipped && (
            <div className="absolute top-2 right-2 bg-green-500 px-2 py-1 rounded text-xs font-bold">
              Equipped
            </div>
          )}
        </motion.div>

        {/* Reflection Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent rounded-xl" />
      </div>
    </motion.div>
  );
}; 