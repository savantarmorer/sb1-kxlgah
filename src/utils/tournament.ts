import { TournamentStatus } from '@/types/tournament';

export function getTournamentStatusBadge(status: TournamentStatus): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'upcoming':
      return 'info';
    case 'registration':
      return 'success';
    case 'in_progress':
      return 'warning';
    case 'completed':
      return 'default';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
}

export function canRegisterForTournament(tournament: {
  status: TournamentStatus;
  max_participants: number;
  tournament_participants?: { length: number }[];
}): boolean {
  if (tournament.status !== 'registration') return false;
  
  const currentParticipants = tournament.tournament_participants?.length || 0;
  return currentParticipants < tournament.max_participants;
}

export function isMatchReady(match: {
  player1: { id: string } | null;
  player2: { id: string } | null;
  status: string;
}): boolean {
  return !!(
    match.player1 &&
    match.player2 &&
    match.status === 'ready'
  );
}

export function getMatchWinner(match: {
  player1: { id: string };
  player2: { id: string };
  winner_id?: string | null;
}): { id: string } | null {
  if (!match.winner_id) return null;
  return match.player1.id === match.winner_id ? match.player1 : match.player2;
} 