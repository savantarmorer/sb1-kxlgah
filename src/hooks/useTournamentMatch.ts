import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { MatchState, Question, MATCH_TIME_LIMIT, QUESTIONS_PER_MATCH, TournamentMatch } from '@/types/tournament';
import { verifyAnswer, calculateScore } from '@/lib/scoring/tournamentScoring';
import { useRealtime } from '@/hooks/useRealtime';
import { useTournament } from '@/contexts/TournamentContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';

interface MatchData {
  matchState: MatchState;
  current_question?: Question;
  player1?: {
    username: string;
    avatar_url?: string;
  };
  player2?: {
    username: string;
    avatar_url?: string;
  };
  handleAnswer: (answer: string) => Promise<void>;
}

export function useTournamentMatch(match_id: string): MatchData | null {
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const { state, submitAnswer } = useTournament();
  const { user } = useAuth();
  const { showToast } = useToast();

  const handleAnswer = async (answer: string) => {
    try {
      const isCorrect = await submitAnswer(match_id, answer);
      showToast(
        isCorrect ? 'Correct answer!' : 'Incorrect answer',
        isCorrect ? 'success' : 'error'
      );
      return isCorrect;
    } catch (error) {
      showToast('Failed to submit answer', 'error');
      return false;
    }
  };

  useEffect(() => {
    if (!match_id || !user) return;

    const loadMatch = async () => {
      const { data: match, error } = await supabase
        .from('tournament_matches')
        .select(`
          *,
          player1:player1_id(username, avatar_url),
          player2:player2_id(username, avatar_url)
        `)
        .eq('id', match_id)
        .single();

      if (error) {
        toast.error('Failed to load match');
        return;
      }

      const { data: question } = await supabase
        .rpc('get_current_match_question', { match_id });

      setMatchData({
        matchState: {
          current_question: 0,
          time_remaining: MATCH_TIME_LIMIT,
          player1_score: match.player1_score,
          player2_score: match.player2_score,
          is_complete: false
        },
        current_question: question,
        player1: match.player1,
        player2: match.player2,
        handleAnswer: async (answer: string) => {
          const isCorrect = await handleAnswer(answer);
          if (isCorrect) {
            const score = calculateScore(matchData?.matchState.time_remaining || 0);
            await submitAnswer(match_id, answer);
          }
        }
      });
    };

    loadMatch();
  }, [match_id, user]);

  useRealtime(`match:${match_id}`, (payload) => {
    if (matchData) {
      setMatchData(prev => ({
        ...prev!,
        matchState: {
          ...prev!.matchState,
          ...payload.new
        }
      }));
    }
  });

  return matchData;
}

export function useMatchesByTournament(tournament_id: string): TournamentMatch[] {
  const [matches, setMatches] = useState<TournamentMatch[]>([]);

  useEffect(() => {
    const fetchMatches = async () => {
      const { data, error } = await supabase
        .from('tournament_matches')
        .select('*, player1:player1_id(*), player2:player2_id(*)')
        .eq('tournament_id', tournament_id)
        .order('round_number', { ascending: true });

      if (!error && data) {
        setMatches(data);
      }
    };

    fetchMatches();
  }, [tournament_id]);

  useRealtime(`tournament_matches:tournament_id=eq.${tournament_id}`, (payload) => {
    if (payload.new) {
      setMatches(prev => {
        const index = prev.findIndex(m => m.id === payload.new.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = payload.new;
          return updated;
        }
        return [...prev, payload.new];
      });
    }
  });

  return matches;
} 