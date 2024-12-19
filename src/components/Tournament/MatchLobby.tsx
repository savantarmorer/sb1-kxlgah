import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TournamentService } from '@/services/tournamentService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { useInterval } from '@/hooks/useInterval';

interface MatchLobbyProps {
  match_id: string;
}

interface LobbyStatus {
  player1_ready: boolean;
  player2_ready: boolean;
  status: string;
  player1_id: string;
  player2_id: string;
  player1_username?: string;
  player2_username?: string;
}

export function MatchLobby({ match_id }: MatchLobbyProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [lobbyStatus, setLobbyStatus] = useState<LobbyStatus | null>(null);
  const [isReady, setIsReady] = useState(false);

  const isPlayer1 = user?.id === lobbyStatus?.player1_id;
  const myReadyStatus = isPlayer1 ? lobbyStatus?.player1_ready : lobbyStatus?.player2_ready;
  const opponentReadyStatus = isPlayer1 ? lobbyStatus?.player2_ready : lobbyStatus?.player1_ready;
  const opponentUsername = isPlayer1 ? lobbyStatus?.player2_username : lobbyStatus?.player1_username;

  // Poll for lobby status updates
  useInterval(async () => {
    if (match_id) {
      try {
        const status = await TournamentService.getMatchLobbyStatus(match_id);
        setLobbyStatus(status);

        // If match has started, redirect to match view
        if (status.status === 'in_progress') {
          window.location.href = `/tournament/match/${match_id}`;
        }
      } catch (error) {
        console.error('Failed to get lobby status:', error);
      }
    }
  }, 2000);

  // Initial load
  useEffect(() => {
    const loadLobbyStatus = async () => {
      try {
        const status = await TournamentService.getMatchLobbyStatus(match_id);
        setLobbyStatus(status);
      } catch (error) {
        console.error('Failed to get initial lobby status:', error);
        showToast('Failed to load lobby status', 'error');
      }
    };

    loadLobbyStatus();
  }, [match_id]);

  const handleReadyClick = async () => {
    if (!user) return;

    try {
      if (!isReady) {
        await TournamentService.joinMatchLobby(match_id, user.id);
        setIsReady(true);
        showToast('You are now ready!', 'success');
      } else {
        await TournamentService.leaveMatchLobby(match_id, user.id);
        setIsReady(false);
        showToast('Ready status removed', 'info');
      }
    } catch (error) {
      console.error('Failed to update ready status:', error);
      showToast('Failed to update ready status', 'error');
    }
  };

  if (!lobbyStatus) {
    return <div>Loading lobby...</div>;
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Match Lobby</h2>
      
      <div className="space-y-4">
        {/* Players */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${myReadyStatus ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span>You</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${opponentReadyStatus ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span>{opponentUsername || 'Opponent'}</span>
          </div>
        </div>

        {/* Status */}
        <div className="text-center text-gray-600">
          {opponentReadyStatus ? (
            <span className="text-green-500">Opponent is ready!</span>
          ) : (
            <span>Waiting for opponent...</span>
          )}
        </div>

        {/* Ready Button */}
        <Button
          onClick={handleReadyClick}
          className={`w-full ${isReady ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
        >
          {isReady ? 'Cancel Ready' : 'Ready'}
        </Button>
      </div>
    </div>
  );
} 