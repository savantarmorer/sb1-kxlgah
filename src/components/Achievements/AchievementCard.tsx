import { motion } from 'framer-motion';
import { Share2, Lock, CheckCircle } from 'lucide-react';
import { Achievement, AchievementCategory } from '../../types/achievements';
import { use_game } from '../../contexts/GameContext';
import Button from '../Button';
import { useAdmin } from '../../hooks/useAdmin';

export interface AchievementCardProps {
  achievement: Achievement;
  category: AchievementCategory;
}

export default function AchievementCard({ achievement, category }: AchievementCardProps) {
  const { dispatch } = use_game();
  const { isAdmin } = useAdmin();
  const Icon = category.icon;

  const handleShare = async () => {
    if (!achievement.unlocked) return;

    try {
      await navigator.share({
        title: 'Conquista Desbloqueada!',
        text: `Acabei de desbloquear "${achievement.title}" no CepaC Play!`,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDebugUnlock = () => {
    if (isAdmin && !achievement.unlocked) {
      dispatch({
        type: 'UPDATE_ACHIEVEMENT_PROGRESS',
        payload: {
          id: achievement.id,
          progress: 100
        }
      });
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`
        relative overflow-hidden rounded-xl p-4 
        ${achievement.unlocked 
          ? 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900' 
          : 'bg-gray-100 dark:bg-gray-800/50'
        }
        border border-gray-200 dark:border-gray-700
        shadow-sm hover:shadow-md transition-all duration-200
      `}
    >
      <div className="relative z-10">
        <div className="flex items-start gap-4">
          <motion.div 
            className={`
              p-3 rounded-lg bg-opacity-10 
              ${category.color} 
              ${achievement.unlocked ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''}
            `}
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Icon className={`${category.color} h-6 w-6`} />
          </motion.div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {achievement.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {achievement.description}
            </p>
          </div>
        </div>
      </div>

      {achievement.unlocked && (
        <motion.div
          className="absolute inset-0 opacity-20"
          initial={{ backgroundPosition: '200% 0' }}
          animate={{ backgroundPosition: '-200% 0' }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{
            background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.5), transparent)',
            backgroundSize: '200% 100%'
          }}
        />
      )}
    </motion.div>
  );
}