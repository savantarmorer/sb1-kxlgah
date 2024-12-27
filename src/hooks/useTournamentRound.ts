import { useState, useEffect, useCallback } from 'react';
import { useTournament } from '@/contexts/TournamentContext';
import { supabase } from '@/lib/supabase';
import { TournamentRoundManager } from '@/lib/tournament/roundManager';
import { TournamentRound, RoundStatus } from '@/types/tournament';
import { TournamentMatch } from '@/types/tournament';

interface RoundStatusInfo {
  status: RoundStatus;
  isComplete: boolean;
}

function getRoundStatus(status: RoundStatus): RoundStatusInfo {
  return {
    status,
    isComplete: status === 'completed'
  };
}

/**
 * Hook para gerenciar estado e ações dos rounds do torneio
 */
export function useTournamentRound(tournament_id: string, round: number) {
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoundMatches();
  }, [tournament_id, round]);

  const loadRoundMatches = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('tournament_matches')
        .select('*, player1:player1_id(*), player2:player2_id(*)')
        .eq('tournament_id', tournament_id)
        .eq('round', round);

      setMatches(data || []);
    } catch (error) {
      setError('Failed to load round matches');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    matches,
    loading,
    error,
    refreshMatches: loadRoundMatches
  };
}