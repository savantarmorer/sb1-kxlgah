import { useEffect, useState } from 'react';
import TournamentService from '@/services/tournamentService';
import { Tournament, TournamentMatch } from '@/types/tournament';
import { supabase } from '@/lib/supabase';

export function useTournament(tournamentId: string) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadTournament();
  }, [tournamentId]);

  async function loadTournament() {
    try {
      setLoading(true);
      const [tournamentData, matchesData] = await Promise.all([
        TournamentService.getTournamentById(tournamentId),
        TournamentService.getMatchesByTournament(tournamentId)
      ]);

      if (!tournamentData) {
        throw new Error('Tournament not found');
      }

      setTournament(tournamentData);
      setMatches(matchesData || []);
    } catch (err) {
      console.error('Error loading tournament:', err);
      setError(err instanceof Error ? err : new Error('Failed to load tournament'));
    } finally {
      setLoading(false);
    }
  }

  async function startMatch(match_id: string, user_id: string) {
    try {
      // Verify user is in the match
      const match = matches.find(m => m.id === match_id);
      if (!match) {
        throw new Error('Match not found');
      }

      if (match.player1_id !== user_id && match.player2_id !== user_id) {
        throw new Error('You are not a participant in this match');
      }

      // Update match status
      const { error } = await supabase
        .from('tournament_matches')
        .update({
          status: 'in_progress',
          start_time: new Date().toISOString()
        })
        .eq('id', match_id);

      if (error) throw error;

      // Refresh tournament data
      await loadTournament();
    } catch (err) {
      console.error('Error starting match:', err);
      throw err;
    }
  }

  async function completeMatch(match_id: string, winner_id: string) {
    try {
      const match = matches.find(m => m.id === match_id);
      if (!match) {
        throw new Error('Match not found');
      }

      // Update match status
      const { error } = await supabase
        .from('tournament_matches')
        .update({
          status: 'completed',
          winner_id,
          end_time: new Date().toISOString()
        })
        .eq('id', match_id);

      if (error) throw error;

      // Refresh tournament data
      await loadTournament();
    } catch (err) {
      console.error('Error completing match:', err);
      throw err;
    }
  }

  return {
    tournament,
    matches,
    loading,
    error,
    refresh: loadTournament,
    startMatch,
    completeMatch
  };
} 