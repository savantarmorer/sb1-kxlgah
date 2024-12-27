import React from 'react';
import { useTournament } from '@/contexts/TournamentContext';
import { Tournament, TournamentStatus } from '@/types/tournament';
import { Badge } from '@/components/ui/Badge';
import { useTranslation } from '@/hooks/useTranslation';

interface TournamentCardProps {
  tournament: Tournament;
}

interface TournamentListProps {
  filter: TournamentStatus;
}

export function TournamentList({ filter }: TournamentListProps) {
  const { state } = useTournament();
  const { t } = useTranslation();

  if (!state.tournaments?.length) {
    return (
      <div className="text-center text-gray-500">
        {t('tournament.no_tournaments')}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {state.tournaments
        .filter((tournament: Tournament) => tournament.status === filter)
        .map((tournament: Tournament) => (
          <TournamentCard 
            key={tournament.id}
            tournament={tournament}
          />
        ))}
    </div>
  );
}

function TournamentCard({ tournament }: TournamentCardProps) {
  const { joinTournament } = useTournament();
  const { t } = useTranslation();

  const getTournamentStatusBadge = (status: TournamentStatus): "default" | "success" | "warning" | "error" => {
    switch (status) {
      case 'registration': return 'default';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">{tournament.name}</h3>
        <Badge variant={getTournamentStatusBadge(tournament.status)}>
          {t(`tournament.status.${tournament.status}`)}
        </Badge>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        {tournament.description}
      </p>

      <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
        <span>
          {tournament.current_players}/{tournament.max_players} players
        </span>
        <span>
          Prize: ${tournament.prize_pool}
        </span>
      </div>

      {tournament.status === 'registration' && (
        <button
          onClick={() => joinTournament(tournament.id)}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {t('tournament.join')}
        </button>
      )}
    </div>
  );
}