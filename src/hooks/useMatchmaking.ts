import { useState, useCallback, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { LiveMatchmakingService } from '../services/liveMatchmakingService';
import type { Player } from '../types/battle';

interface MatchmakingPreferences {
  mode?: 'casual' | 'ranked';
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface MatchmakingState {
  status: 'idle' | 'searching' | 'matched' | 'ready' | 'error';
  matchId?: string;
  opponent?: Player;
  error?: string;
}

export function useMatchmaking() {
  const { state } = useGame();
  const [matchmakingState, setMatchmakingState] = useState<MatchmakingState>({
    status: 'idle'
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.user) {
        LiveMatchmakingService.leaveQueue(state.user.id);
      }
    };
  }, [state.user]);

  const joinQueue = useCallback(async (preferences?: MatchmakingPreferences) => {
    if (!state.user) {
      setMatchmakingState({
        status: 'error',
        error: 'User not authenticated'
      });
      return;
    }

    try {
      setMatchmakingState({ status: 'searching' });

      const player: Player = {
        id: state.user.id,
        name: state.user.name,
        rating: state.user.battle_rating || 1000,
        level: state.user.level || 1,
        avatar_url: state.user.avatar_url,
        streak: state.user.streak
      };

      await LiveMatchmakingService.joinQueue(
        player,
        preferences,
        (newState) => setMatchmakingState(newState)
      );
    } catch (error) {
      setMatchmakingState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to join queue'
      });
    }
  }, [state.user]);

  const leaveQueue = useCallback(async () => {
    if (state.user) {
      await LiveMatchmakingService.leaveQueue(state.user.id);
      setMatchmakingState({ status: 'idle' });
    }
  }, [state.user]);

  const cancelMatch = useCallback(async () => {
    if (state.user && matchmakingState.matchId) {
      await LiveMatchmakingService.leaveQueue(state.user.id);
      setMatchmakingState({ status: 'idle' });
    }
  }, [state.user, matchmakingState.matchId]);

  return {
    matchmakingState,
    joinQueue,
    leaveQueue,
    cancelMatch,
    isSearching: matchmakingState.status === 'searching',
    isMatched: matchmakingState.status === 'matched',
    hasError: matchmakingState.status === 'error',
    error: matchmakingState.error,
    opponent: matchmakingState.opponent
  };
} 