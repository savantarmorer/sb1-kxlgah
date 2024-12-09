import { useState, useEffect } from 'react';
import { TournamentService } from '@/services/tournamentService';
import { Tournament, TournamentMatch } from '@/types/tournament';
import { useAuth } from './useAuth';

export function useTournament(tournamentId?: string) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (tournamentId) {
      loadTournament();
    }
  }, [tournamentId]);

  const loadTournament = async () => {
    if (!tournamentId) return;
    
    setLoading(true);
    try {
      const tournament = await TournamentService.getTournamentById(tournamentId);
      setTournament(tournament);
      
      const matches = await TournamentService.getMatchesByTournament(tournamentId);
      setMatches(matches);
    } catch (error) {
      setError('Failed to load tournament');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const registerForTournament = async () => {
    if (!tournamentId || !user) return;
    
    setLoading(true);
    try {
      await TournamentService.registerPlayer(tournamentId, user.id);
      await loadTournament();
    } catch (error) {
      setError('Failed to register for tournament');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    tournament,
    matches,
    loading,
    error,
    registerForTournament,
    refreshTournament: loadTournament
  };
} 