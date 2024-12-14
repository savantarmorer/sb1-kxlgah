import React, { createContext, useContext, useReducer, useCallback } from 'react';
import TournamentService from '@/services/TournamentService';
import { Tournament, TournamentMatch } from '@/types/tournament';
import { supabase } from '@/lib/supabase';

interface TournamentState {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  currentMatch: TournamentMatch | null;
  matchState: {
    time_remaining: number;
    current_question: number;
    score_player: number;
    score_opponent: number;
  } | null;
  loading: boolean;
  error: string | null;
}

type TournamentAction = 
  | { type: 'SET_TOURNAMENTS'; payload: Tournament[] }
  | { type: 'SET_CURRENT_TOURNAMENT'; payload: Tournament }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: TournamentState = {
  tournaments: [],
  currentTournament: null,
  currentMatch: null,
  matchState: null,
  loading: false,
  error: null
};

const TournamentContext = createContext<{
  state: TournamentState;
  startMatch: (match_id: string, player_id: string) => Promise<void>;
  joinTournament: (tournament_id: string) => Promise<void>;
  submitAnswer: (match_id: string, answer: string) => Promise<boolean>;
} | undefined>(undefined);

function tournamentReducer(state: TournamentState, action: TournamentAction): TournamentState {
  switch (action.type) {
    case 'SET_TOURNAMENTS':
      return { ...state, tournaments: action.payload };
    case 'SET_CURRENT_TOURNAMENT':
      return { ...state, currentTournament: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tournamentReducer, initialState);

  const startMatch = useCallback(async (match_id: string, player_id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await TournamentService.startMatch(match_id, player_id);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start match' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const joinTournament = useCallback(async (tournament_id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');
      
      await TournamentService.registerPlayer(tournament_id, user.data.user.id);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to join tournament' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const submitAnswer = useCallback(async (match_id: string, answer: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');
      
      // For now, just return true since we haven't implemented answer submission
      return true;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to submit answer' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  return (
    <TournamentContext.Provider value={{ state, startMatch, joinTournament, submitAnswer }}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
}