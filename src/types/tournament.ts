import { User } from '@/types/user';

export type TournamentStatus = 'upcoming' | 'registration' | 'in_progress' | 'completed' | 'cancelled';
export type TournamentFormat = 'single_elimination' | 'double_elimination' | 'round_robin';
export type MatchFormat = 'best_of_1' | 'best_of_3' | 'best_of_5';
export type RoundStatus = 'pending' | 'in_progress' | 'completed';
export type MatchStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correct_answer: string;
  subject_area: string;
  difficulty: number;
  time_limit: number;
}

export interface BracketAnimation {
  type: 'match_start' | 'match_end' | 'round_advance';
  target_id: string;
  duration: number;
}

export interface Player {
  id: string;
  username: string;
  avatar_url?: string;
  rating: number;
  tournament_id?: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  entryFee: number;
  maxPlayers: number;
  minLevel: number;
  status: TournamentStatus;
  rules: {
    format?: string;
    matchFormat?: string;
    minPlayers?: number;
  };
  rewards: {
    prizePool?: number;
    distribution?: {
      first: number;
      second: number;
      third: number;
    };
  };
  currentPlayers: number;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentPlayer {
  id: string;
  userId: string;
  username: string;
  isBot: boolean;
  seed?: number;
  status: 'registered' | 'checked_in' | 'eliminated' | 'winner';
  stats: {
    wins: number;
    losses: number;
    draws: number;
    score: number;
  };
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  player1_id: string;
  player2_id: string;
  winner_id?: string;
  player1_score: number;
  player2_score: number;
  status: string;
  start_time?: string;
  end_time?: string;
  error_count: number;
  created_at: string;
  updated_at: string;
}

export interface TournamentRewards {
  positions: {
    [key: number]: {
      amount: number;
      currency: string;
      items?: any[];
    };
  };
  participation?: {
    amount: number;
    currency: string;
    items?: any[];
  };
}

export interface TournamentSettings {
  format: TournamentFormat;
  matchFormat: MatchFormat;
  allowBots: boolean;
  autoStart: boolean;
  checkInRequired: boolean;
  checkInPeriodMinutes: number;
  maxPlayersPerMatch: number;
  roundTimeoutMinutes: number;
  showBrackets: boolean;
  showLeaderboard: boolean;
  enableChat: boolean;
  requireEntryFee: boolean;
  allowSpectators: boolean;
}

export interface TournamentBracket {
  rounds: TournamentRound[];
  winners: string[];
  losers: string[];
}

export interface TournamentRound {
  number: number;
  matches: TournamentMatch[];
  status: RoundStatus;
  startTime?: string;
  endTime?: string;
}

export interface MatchState {
  current_question: number;
  time_remaining: number;
  player1_score: number;
  player2_score: number;
  is_complete: boolean;
}

export interface CreateTournamentDTO {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  max_players: number;
  entry_fee: number;
  prize_pool: number;
}

export interface RateLimitConfig {
  max_requests: number;
  window_seconds: number;
}

export interface RateLimitInfo {
  remaining: number;
  reset: number;
}

export interface SpectatorInfo {
  user_id: string;
  match_id: string;
  joined_at: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  score: number;
  matches_played: number;
  status: string;
  joined_at: string;
}

export const MATCH_TIME_LIMIT = 300; // 5 minutes in seconds
export const QUESTIONS_PER_MATCH = 10;
export const TOURNAMENT_ROUNDS = ['quarter_finals', 'semi_finals', 'finals'] as const;

export const SCORING_CONFIG = {
  base_points: 100,
  time_bonus: {
    multiplier: 0.5,
    max_bonus: 50
  },
  streak_bonus: {
    multiplier: 0.2,
    max_bonus: 100
  }
};

export interface TournamentState {
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