import React from 'react';
import { motion } from 'framer-motion';
import { Achievement, AchievementMilestone, AchievementReward } from '../../types/achievements';
import { AchievementProgress } from './AchievementProgress';
import { AchievementRequirements } from './AchievementRequirements';
import { Trophy, Lock, Gift, Coins, Gem, Crown, User, Sparkles } from 'lucide-react';
import { Button, Tooltip } from '@mui/material';
import { useAchievements } from '../../hooks/useAchievements';

const RewardIcon = ({ type, className }: { type: string; className?: string }) => {
  switch (type) {
    case 'coins':
      return <Coins className={className} />;
    case 'gems':
      return <Gem className={className} />;
    case 'title':
      return <Crown className={className} />;
    case 'avatar':
      return <User className={className} />;
    case 'xp':
      return <Sparkles className={className} />;
    default:
      return <Gift className={className} />;
  }
};

const RewardPreview = ({ reward }: { reward: AchievementReward }) => {
  const getRewardText = () => {
    switch (reward.type) {
      case 'coins':
        return `${reward.value} coins`;
      case 'gems':
        return `${reward.value} gems`;
      case 'title':
        return `Title: ${reward.value}`;
      case 'avatar':
        return `Avatar: ${reward.value}`;
      case 'xp':
        return `${reward.value} XP`;
      default:
        return `${reward.value}`;
    }
  };

  return (
    <Tooltip title={getRewardText()}>
      <div className={`
        flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
        ${reward.rarity === 'legendary' ? 'bg-yellow-100/20 text-yellow-500' :
          reward.rarity === 'epic' ? 'bg-purple-100/20 text-purple-500' :
          reward.rarity === 'rare' ? 'bg-blue-100/20 text-blue-500' :
          'bg-gray-100/20 text-gray-500'}
        dark:bg-opacity-10
      `}>
        <RewardIcon type={reward.type} className="w-3 h-3" />
        <span>{reward.value}</span>
      </div>
    </Tooltip>
  );
};

const MilestonePreview = ({ milestone, currentProgress }: { 
  milestone: AchievementMilestone; 
  currentProgress: number;
}) => {
  const isReached = currentProgress >= milestone.progress;
  
  return (
    <div className={`
      flex items-center gap-2 p-2 rounded-lg
      ${isReached ? 'bg-green-100/10 dark:bg-green-900/10' : 'bg-gray-100/10 dark:bg-gray-900/10'}
    `}>
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center
        ${isReached ? 'bg-green-500' : 'bg-gray-500'}
      `}>
        {isReached ? '✓' : `${milestone.progress}%`}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">
          {milestone.description || `Reach ${milestone.progress}% completion`}
        </div>
        <div className="flex gap-1 mt-1">
          <RewardPreview reward={milestone.reward} />
        </div>
      </div>
    </div>
  );
};

export function AchievementCard({ achievement }: { achievement: Achievement }) {
  const { claimAchievement } = useAchievements();
  
  const getRarityStyles = () => {
    switch (achievement.rarity) {
      case 'legendary':
        return {
          border: 'border-yellow-500/30 dark:border-yellow-500/20',
          bg: 'from-yellow-500/10 dark:from-yellow-500/5',
          icon: 'text-yellow-500 dark:text-yellow-400',
          badge: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
          glow: 'shadow-yellow-500/10 dark:shadow-yellow-500/5'
        };
      case 'epic':
        return {
          border: 'border-purple-500/30 dark:border-purple-500/20',
          bg: 'from-purple-500/10 dark:from-purple-500/5',
          icon: 'text-purple-500 dark:text-purple-400',
          badge: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
          glow: 'shadow-purple-500/10 dark:shadow-purple-500/5'
        };
      case 'rare':
        return {
          border: 'border-blue-500/30 dark:border-blue-500/20',
          bg: 'from-blue-500/10 dark:from-blue-500/5',
          icon: 'text-blue-500 dark:text-blue-400',
          badge: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
          glow: 'shadow-blue-500/10 dark:shadow-blue-500/5'
        };
      default:
        return {
          border: 'border-gray-300/30 dark:border-gray-600/20',
          bg: 'from-gray-100/10 dark:from-gray-700/5',
          icon: 'text-gray-500 dark:text-gray-400',
          badge: 'bg-gray-200/50 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300',
          glow: 'shadow-gray-300/10 dark:shadow-gray-700/5'
        };
    }
  };

  const styles = getRarityStyles();
  
  const nextMilestone = achievement.milestones
    .filter(m => m.progress > achievement.progress)
    .sort((a, b) => a.progress - b.progress)[0];

  const handleClaim = async () => {
    if (achievement.ready_to_claim) {
      await claimAchievement(achievement.id);
    }
  };

  return (
    <motion.div
      className={`
        relative overflow-hidden
        rounded-lg border ${styles.border}
        ${achievement.unlocked 
          ? `bg-gradient-to-br ${styles.bg} to-white/5 dark:to-gray-800 shadow-lg ${styles.glow}` 
          : 'bg-gray-50 dark:bg-gray-800/50'
        }
        p-4 h-full
      `}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start gap-3">
        <div className={`
          p-2 rounded-lg ${achievement.unlocked ? styles.icon : 'text-gray-400 dark:text-gray-500'}
          ${achievement.unlocked ? 'bg-white/80 dark:bg-gray-800 shadow-sm' : 'bg-gray-100 dark:bg-gray-700'}
        `}>
          {achievement.unlocked ? (
            <Trophy size={24} />
          ) : (
            <Lock size={24} />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {achievement.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {achievement.description}
          </p>
          
          <div className="flex items-center gap-2 mt-2">
            <span className={`
              px-2 py-0.5 rounded-full text-xs font-medium
              ${styles.badge}
            `}>
              {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {achievement.points} points
            </span>
          </div>
        </div>
      </div>

      <AchievementProgress achievement={achievement} />
      <AchievementRequirements achievement={achievement} />

      {achievement.ready_to_claim && !achievement.claimed && (
        <div className="mt-4">
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<Gift size={20} />}
            onClick={handleClaim}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              fontWeight: 'bold',
            }}
          >
            Claim Reward
          </Button>
        </div>
      )}

      {achievement.unlocked && (
        <div className="absolute top-2 right-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`w-6 h-6 rounded-full flex items-center justify-center ${styles.badge} shadow-sm`}
          >
            ✓
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}