import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface LevelUpNotificationProps {
  level: number;
  rewards: {
    coins: number;
    xp_bonus: number;
  };
}

export function LevelUpNotification({ level, rewards }: LevelUpNotificationProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl"
    >
      <div className="text-center">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-4">Level Up!</h2>
        <p className="text-xl mb-2">You reached Level {level}</p>
        <div className="space-y-2">
          <p className="text-green-500">+{rewards.coins} Coins</p>
          <p className="text-blue-500">+{rewards.xp_bonus} Bonus XP</p>
        </div>
      </div>
    </motion.div>
  );
}
