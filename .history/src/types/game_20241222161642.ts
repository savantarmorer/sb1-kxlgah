import { User } from './user';

export interface BattleStats {
  user_id: string;
  total_battles: number;
  wins: number;
  losses: number;
  win_streak: number;
  highest_streak: number;
  total_xp_earned: number;
  total_coins_earned: number;
  tournaments_played?: number;
  tournaments_won?: number;
  tournament_matches_played?: number;
  tournament_matches_won?: number;
  tournament_rating?: number;
  difficulty?: number;
  updated_at?: string;
}

export interface BattleRatings {
  user_id: string;
  rating: number;
  wins: number;
  losses: number;
  streak: number;
  highest_streak: number;
  updated_at: string;
}

export interface GameState {
  user: User | null;
  battle_stats: BattleStats | null;
  battle_ratings: BattleRatings | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface GameAction {
  type: string;
  payload?: any;
}