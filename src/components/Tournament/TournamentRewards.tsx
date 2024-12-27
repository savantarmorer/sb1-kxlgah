import React from 'react';
import { motion } from 'framer-motion';
import { useTournament } from '@/contexts/TournamentContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Badge } from '@/components/ui/Badge';
import { Trophy, Star, Gift, Award, Coins } from 'lucide-react';

interface TournamentRewardsProps {
  tournament_id: string;
}

export function TournamentRewards({ tournament_id }: TournamentRewardsProps) {
  const { state } = useTournament();
  const { t } = useTranslation();
  const tournament = state.tournaments?.find(t => t.id === tournament_id);

  if (!tournament) return null;

  const rewardTiers = [
    {
      position: 1,
      icon: <Trophy className="w-6 h-6 text-yellow-500" />,
      rewards: tournament.rewards.first,
      color: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      position: 2,
      icon: <Star className="w-6 h-6 text-gray-400" />,
      rewards: tournament.rewards.second,
      color: 'bg-gray-50 dark:bg-gray-900/20'
    },
    {
      position: 3,
      icon: <Award className="w-6 h-6 text-amber-600" />,
      rewards: tournament.rewards.third,
      color: 'bg-amber-50 dark:bg-amber-900/20'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">{t('tournament.rewards')}</h2>

      <div className="space-y-6">
        {/* Prize Pool Overview */}
        <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <div className="flex items-center space-x-3">
            <Gift className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="font-medium">{t('tournament.prize_pool')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('tournament.total_prizes')}: {tournament.total_prizes}
              </p>
            </div>
          </div>
          <Badge variant="primary" className="flex items-center space-x-2">
            <Coins className="w-4 h-4" />
            <span>{tournament.prize_pool}</span>
          </Badge>
        </div>

        {/* Reward Tiers */}
        <div className="grid gap-4 md:grid-cols-3">
          {rewardTiers.map((tier, index) => (
            <motion.div
              key={tier.position}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg ${tier.color}`}
            >
              <div className="flex items-center space-x-3 mb-4">
                {tier.icon}
                <h3 className="font-semibold">
                  {t('tournament.position')} #{tier.position}
                </h3>
              </div>

              <div className="space-y-2">
                {tier.rewards.map((reward, rewardIndex) => (
                  <div
                    key={rewardIndex}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{reward.name}</span>
                    <Badge variant="secondary">
                      {reward.amount} {reward.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Special Achievements */}
        <div className="mt-8">
          <h3 className="font-semibold mb-4">{t('tournament.special_achievements')}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {tournament.achievements?.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-shrink-0">
                  <Award className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{achievement.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {achievement.description}
                  </p>
                </div>
                <Badge variant="success">+{achievement.points} XP</Badge>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 