import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { TournamentMatch, MatchState } from '@/types/tournament';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TournamentChat } from './TournamentChat';
import { Eye, Users } from 'lucide-react';

interface SpectatorViewProps {
  matchId: string;
}

export function SpectatorView({ matchId }: SpectatorViewProps) {
  const [match, setMatch] = useState<TournamentMatch | null>(null);
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [isSpectating, setIsSpectating] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let matchSubscription: any;
    let stateSubscription: any;
    let spectatorSubscription: any;

    async function setupSpectator() {
      if (!user) return;

      try {
        // Join as spectator
        const { error: joinError } = await supabase
          .from('tournament_spectators')
          .insert({
            match_id: matchId,
            user_id: user.id
          });

        if (joinError) throw joinError;
        setIsSpectating(true);

        // Get initial match data
        const { data: matchData, error: matchError } = await supabase
          .from('tournament_matches')
          .select(`
            *,
            player1:player1_id(*),
            player2:player2_id(*)
          `)
          .eq('id', matchId)
          .single();

        if (matchError) throw matchError;
        setMatch(matchData);

        // Subscribe to match updates
        matchSubscription = supabase
          .channel('spectator_match')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tournament_matches',
              filter: `id=eq.${matchId}`
            },
            (payload) => {
              setMatch((prev) => ({ ...prev, ...payload.new }));
            }
          )
          .subscribe();

        // Subscribe to match state
        stateSubscription = supabase
          .channel('spectator_state')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'match_states',
              filter: `match_id=eq.${matchId}`
            },
            (payload) => {
              setMatchState(payload.new as MatchState);
            }
          )
          .subscribe();

        // Subscribe to spectator count
        spectatorSubscription = supabase
          .channel('spectator_count')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tournament_spectators',
              filter: `match_id=eq.${matchId}`
            },
            async () => {
              const { count } = await supabase
                .from('tournament_spectators')
                .select('*', { count: 'exact' })
                .eq('match_id', matchId);
              setSpectatorCount(count || 0);
            }
          )
          .subscribe();
      } catch (error) {
        console.error('Error setting up spectator:', error);
      }
    }

    setupSpectator();

    return () => {
      // Leave spectator mode
      if (user) {
        supabase
          .from('tournament_spectators')
          .delete()
          .match({ match_id: matchId, user_id: user.id });
      }

      matchSubscription?.unsubscribe();
      stateSubscription?.unsubscribe();
      spectatorSubscription?.unsubscribe();
    };
  }, [matchId, user]);

  if (!match || !matchState) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Match Spectator</h2>
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span>{spectatorCount} watching</span>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-3 gap-4">
          {/* Player 1 */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              <h3 className="font-semibold">{match.player1?.username}</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{matchState.player1_score}</p>
          </div>

          {/* Match Info */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Question {matchState.current_question + 1}
            </p>
            <Progress
              value={(matchState.time_remaining / match.time_limit) * 100}
              className="mt-2"
            />
            <p className="text-sm mt-2">
              {Math.ceil(matchState.time_remaining)}s remaining
            </p>
          </div>

          {/* Player 2 */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              <h3 className="font-semibold">{match.player2?.username}</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{matchState.player2_score}</p>
          </div>
        </div>
      </Card>

      {/* Tournament Chat */}
      <TournamentChat tournamentId={match.tournament_id} />
    </div>
  );
} 