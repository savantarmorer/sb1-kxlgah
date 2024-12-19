import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTournamentMatch } from '@/hooks/useTournamentMatch';
import { Button } from '@/components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { TournamentMatch as TournamentMatchType } from '@/types/tournament';

interface TournamentMatchProps {
  match: TournamentMatchType;
  onMatchComplete?: () => void;
}

export function TournamentMatch({ match, onMatchComplete }: TournamentMatchProps) {
  const { user } = useAuth();
  const {
    currentQuestion,
    timeRemaining,
    playerScore,
    opponentScore,
    submitAnswer,
    loading,
    error
  } = useTournamentMatch(match.id);

  const isParticipant = user?.id === match.player1_id || user?.id === match.player2_id;

  if (!isParticipant) {
    return (
      <div className="text-center p-4">
        You are not a participant in this match
      </div>
    );
  }

  if (loading) {
    return <div>Loading match...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Match Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <PlayerAvatar
            playerId={match.player1_id}
            score={playerScore}
          />
          <span className="text-2xl font-bold">VS</span>
          <PlayerAvatar
            playerId={match.player2_id}
            score={opponentScore}
          />
        </div>
        <div className="text-xl font-bold">
          Time: {Math.ceil(timeRemaining)}s
        </div>
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h3 className="text-xl font-bold mb-4">
            {currentQuestion.text}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                onClick={() => submitAnswer(option)}
                variant="outline"
                className="py-4 text-left"
              >
                {option}
              </Button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

interface PlayerAvatarProps {
  playerId: string;
  score: number;
}

function PlayerAvatar({ playerId, score }: PlayerAvatarProps) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-gray-200 mb-2" />
      <div className="font-bold">{score}</div>
    </div>
  );
} 