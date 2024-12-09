import React from 'react';
import { motion } from 'framer-motion';
import { useTournament } from '@/contexts/TournamentContext';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDate } from '@/utils/date';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Trophy, Calendar, Users, ChevronRight } from 'lucide-react';

export function TournamentHistory() {
  const { state, loadTournamentDetails } = useTournament();
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('tournament.history')}</h2>
        <Badge variant="secondary">
          {t('tournament.total_participated')}: {state.participatedTournaments?.length || 0}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {state.participatedTournaments?.map((tournament, index) => (
          <motion.div
            key={tournament.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-lg">{tournament.title}</h3>
              <Badge
                variant={tournament.user_rank <= 3 ? 'success' : 'secondary'}
                className="flex items-center space-x-1"
              >
                <Trophy className="w-4 h-4" />
                <span>#{tournament.user_rank}</span>
              </Badge>
            </div>

            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(tournament.end_date)}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>{tournament.total_participants} {t('tournament.participants')}</span>
              </div>

              <div className="pt-2">
                <div className="font-medium text-gray-900 dark:text-white mb-1">
                  {t('tournament.performance')}:
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    {t('tournament.matches_won')}: {tournament.matches_won}
                  </div>
                  <div>
                    {t('tournament.total_score')}: {tournament.score}
                  </div>
                  <div>
                    {t('tournament.accuracy')}: {tournament.accuracy}%
                  </div>
                  <div>
                    {t('tournament.avg_time')}: {tournament.average_time}s
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              className="w-full mt-4 justify-between"
              onClick={() => loadTournamentDetails(tournament.id)}
            >
              {t('tournament.view_details')}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 