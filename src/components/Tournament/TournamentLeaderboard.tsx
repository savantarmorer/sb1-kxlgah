import React from 'react';
import { motion } from 'framer-motion';
import { useTournament } from '@/contexts/TournamentContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Trophy, Medal, Award } from 'lucide-react';

interface TournamentLeaderboardProps {
  tournament_id: string;
}

export function TournamentLeaderboard({ tournament_id }: TournamentLeaderboardProps) {
  const { state } = useTournament();
  const { t } = useTranslation();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">{t('tournament.leaderboard')}</h2>
      
      <div className="space-y-4">
        {state.participants
          .sort((a, b) => b.score - a.score)
          .map((participant, index) => (
            <motion.div
              key={participant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <span className="font-bold w-8 text-center">
                  {getRankIcon(index + 1) || `#${index + 1}`}
                </span>
                <Avatar
                  src={participant.avatar_url}
                  alt={participant.username}
                  className="w-10 h-10"
                />
                <div>
                  <h3 className="font-medium">{participant.username}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('tournament.matches_won')}: {participant.matches_won}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Badge variant="primary">
                  {participant.score} {t('tournament.points')}
                </Badge>
                {participant.achievements?.map((achievement) => (
                  <Badge
                    key={achievement.id}
                    variant="secondary"
                    title={achievement.description}
                  >
                    {achievement.name}
                  </Badge>
                ))}
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  );
} 