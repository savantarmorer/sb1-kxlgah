import React, { useState, useEffect } from 'react';
import { useTournament } from '@/contexts/TournamentContext';
import { useAuth } from '@/hooks/useAuth';
import { useSound } from '@/hooks/useSound';
import { Avatar } from '@/components/ui/Avatar';
import { Timer } from '@/components/ui/Timer';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface MatchViewProps {
  match_id: string;
}

export function MatchView({ match_id }: MatchViewProps) {
  const { state, submitAnswer } = useTournament();
  const { user } = useAuth();
  const [isAnswering, setIsAnswering] = useState(false);

  const correctSound = useSound('/sounds/correct.mp3');
  const incorrectSound = useSound('/sounds/incorrect.mp3');
  const countdownSound = useSound('/sounds/countdown.mp3');
  const timeUpSound = useSound('/sounds/time-up.mp3');

  const handleAnswerSubmit = async (answer: string) => {
    setIsAnswering(true);
    try {
      const result = await submitAnswer(match_id, answer);
      if (result) {
        correctSound.play();
      } else {
        incorrectSound.play();
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar
            src={state.currentMatch?.player1?.avatar_url || ''}
            alt={state.currentMatch?.player1?.username || 'Player 1'}
            text={state.currentMatch?.player1?.username?.[0] || 'P1'}
            size="md"
          />
          <div>
            <div className="font-medium">
              {state.currentMatch?.player1?.username || 'Player 1'}
            </div>
            <div className="text-sm text-gray-500">
              Score: {state.currentMatch?.player1_score || 0}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-lg font-bold">VS</div>
          <Timer
            duration={state.matchState?.time_remaining || 0}
            onTick={() => countdownSound.play()}
            onComplete={() => timeUpSound.play()}
          />
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="font-medium">
              {state.currentMatch?.player2?.username || 'Player 2'}
            </div>
            <div className="text-sm text-gray-500">
              Score: {state.currentMatch?.player2_score || 0}
            </div>
          </div>
          <Avatar
            src={state.currentMatch?.player2?.avatar_url || ''}
            alt={state.currentMatch?.player2?.username || 'Player 2'}
            text={state.currentMatch?.player2?.username?.[0] || 'P2'}
            size="md"
          />
        </div>
      </div>

      {/* Question and answer section */}
      {state.matchState && (
        <div className="mt-8">
          <div className="text-lg font-medium mb-4">
            Question {state.matchState.current_question + 1}
          </div>
          {/* Add question and answer UI here */}
        </div>
      )}
    </div>
  );
}