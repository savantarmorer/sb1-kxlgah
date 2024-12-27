/**
 * LeaderboardEntry interface
 * Maps to database tables:
 * - profiles: username, avatar_url, title, level, xp
 * - battle_stats: rating, streak
 * - user_achievements: achievements count
 */
export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url?: string;
  title?: string;
  score: number;
  rank: number;
  rating?: number;
  streak?: number;
  level?: number;
  achievements_count?: number;
  constitutional_score?: number;
  civil_score?: number;
  criminal_score?: number;
  administrative_score?: number;
  is_super_admin?: boolean;
  created_at?: string;
} 