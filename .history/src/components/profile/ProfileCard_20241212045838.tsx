import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { User } from '../../types/user';
import { LevelSystem } from '../../lib/levelSystem';

interface ProfileCardProps {
  user: User;
}

interface StatItemProps {
  label: string;
  value: number | string;
}

export const ProfileCard = ({ user }: ProfileCardProps) => {
  const current_level_total_xp = LevelSystem.calculate_total_xp_for_level(user.level);
  const xp_in_current_level = user.xp - current_level_total_xp;
  const xp_needed_for_next_level = LevelSystem.calculate_xp_for_level(user.level);
  const progress = Math.min(100, Math.floor((xp_in_current_level / xp_needed_for_next_level) * 100));

  return (
    <Card className="p-6">
      <div className="flex items-start gap-6">
        {/* Avatar Section */}
        <motion.div 
          className="relative"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="relative w-24 h-24">
            <img
              src={user.avatar_url || '/default-avatar.png'}
              alt={user.name || user.username}
              className="rounded-full object-cover w-full h-full"
            />
            {/* Avatar Frame */}
            <div 
              className="absolute inset-0 rounded-full border-2"
              style={{
                borderImage: 'linear-gradient(45deg, #0ea5e9, #ec4899) 1',
              }}
            />
          </div>
          
          {/* Level Badge */}
          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full p-2 text-white font-bold text-sm">
            {user.level}
          </div>
        </motion.div>

        {/* Info Section */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {user.name || user.username}
          </h2>
          {user.stats?.highest_score && (
            <p className="text-primary-500 dark:text-primary-400 font-medium">
              Top Score: {user.stats.highest_score}
            </p>
          )}
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <StatItem 
              label="XP" 
              value={`${xp_in_current_level.toLocaleString()} / ${xp_needed_for_next_level.toLocaleString()}`} 
            />
            <StatItem 
              label="Wins" 
              value={user.stats?.matches_won || 0} 
            />
            <StatItem 
              label="Streak" 
              value={user.streak} 
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

const StatItem = ({ label, value }: StatItemProps) => (
  <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
    <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    <div className="text-lg font-bold text-gray-900 dark:text-white">{value}</div>
  </div>
); 