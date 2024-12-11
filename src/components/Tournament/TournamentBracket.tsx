import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTournament } from '@/contexts/TournamentContext';
import { useMatchesByTournament } from '@/hooks/useTournamentMatch';
import { useParticleEffect } from '@/lib/animations/tournamentAnimations';
import { Button } from '@/components/ui/Button';
import { PlayerInfo } from '@/components/PlayerInfo';
import { useTranslation } from '@/hooks/useTranslation';
import { TournamentMatch, BracketAnimation } from '@/types/tournament';
import { Users, Timer, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

interface TournamentBracketProps {
  tournament_id: string;
}

export function TournamentBracket({ tournament_id }: TournamentBracketProps) {
  const { t } = useTranslation();
  const { state, startMatch } = useTournament();
  const { user } = useAuth();
  const matches = useMatchesByTournament(tournament_id);
  const [isLoading, setIsLoading] = useState(false);
  const { showParticles } = useParticleEffect();

  const handleStartMatch = async (match: TournamentMatch) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      await startMatch(match.id, user.id);
      showParticles(1000);
      toast.success(t('tournament.match_started'));
    } catch (error) {
      console.error('Error starting match:', error);
      toast.error(t('tournament.error.start_match'));
    } finally {
      setIsLoading(false);
    }
  };

  const rounds = Array.from(
    new Set(matches.map(match => match.round))
  ).sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {rounds.map((roundIndex) => (
          <motion.div
            key={roundIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold">
              {t(`tournament.round.${roundIndex}`)}
            </h3>

            <div className="space-y-4">
              {matches
                .filter(match => match.round === roundIndex)
                .map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onStartMatch={handleStartMatch}
                    isLoading={isLoading}
                  />
                ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface MatchCardProps {
  match: TournamentMatch;
  onStartMatch: (match: TournamentMatch) => Promise<void>;
  isLoading: boolean;
}

function MatchCard({ match, onStartMatch, isLoading }: MatchCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const isPlayerInMatch = user && (match.player1_id === user.id || match.player2_id === user.id);
  const canStartMatch = isPlayerInMatch && match.status === 'ready';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <PlayerInfo
            player={match.player1_id}
            isWinner={match.winner_id === match.player1_id}
          />
        </div>

        <div className="mx-4 text-lg font-bold">VS</div>

        <div className="flex-1">
          <PlayerInfo
            player={match.player2_id}
            isWinner={match.winner_id === match.player2_id}
          />
        </div>
      </div>

      {canStartMatch && (
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => onStartMatch(match)}
            isLoading={isLoading}
            size="sm"
            className="w-auto"
          >
            {t('tournament.start_match')}
          </Button>
        </div>
      )}
    </div>
  );
} 