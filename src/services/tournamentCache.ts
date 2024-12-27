import { Tournament, TournamentMatch } from '@/types/tournament';
import { TournamentError } from '@/errors/TournamentError';

const CACHE_TTL = {
  TOURNAMENT: 60 * 5, // 5 minutes
  MATCH: 60 * 2, // 2 minutes
  LEADERBOARD: 60 // 1 minute
};

class BrowserCache {
  static getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const { value, expiry } = JSON.parse(item);
      if (expiry && expiry < Date.now()) {
        localStorage.removeItem(key);
        return null;
      }

      return value;
    } catch {
      return null;
    }
  }

  static setItem(key: string, value: any, ttl: number): void {
    const item = {
      value,
      expiry: Date.now() + (ttl * 1000)
    };
    localStorage.setItem(key, JSON.stringify(item));
  }

  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}

export class TournamentCache {
  static async getTournament(tournament_id: string): Promise<Tournament | null> {
    try {
      return BrowserCache.getItem<Tournament>(`tournament:${tournament_id}`);
    } catch (error) {
      console.error('Cache error:', error);
      return null;
    }
  }

  static async setTournament(tournament_id: string, data: Tournament): Promise<void> {
    try {
      BrowserCache.setItem(`tournament:${tournament_id}`, data, CACHE_TTL.TOURNAMENT);
    } catch (error) {
      console.error('Cache error:', error);
    }
  }

  static async getMatch(match_id: string): Promise<TournamentMatch | null> {
    try {
      return BrowserCache.getItem<TournamentMatch>(`match:${match_id}`);
    } catch (error) {
      console.error('Cache error:', error);
      return null;
    }
  }

  static async setMatch(match_id: string, data: TournamentMatch): Promise<void> {
    try {
      BrowserCache.setItem(`match:${match_id}`, data, CACHE_TTL.MATCH);
    } catch (error) {
      console.error('Cache error:', error);
    }
  }

  static async getLeaderboard(tournament_id: string): Promise<any[] | null> {
    try {
      return BrowserCache.getItem<any[]>(`leaderboard:${tournament_id}`);
    } catch (error) {
      console.error('Cache error:', error);
      return null;
    }
  }

  static async setLeaderboard(tournament_id: string, data: any[]): Promise<void> {
    try {
      BrowserCache.setItem(`leaderboard:${tournament_id}`, data, CACHE_TTL.LEADERBOARD);
    } catch (error) {
      console.error('Cache error:', error);
    }
  }

  static async invalidateMatch(match_id: string): Promise<void> {
    try {
      BrowserCache.removeItem(`match:${match_id}`);
    } catch (error) {
      console.error('Cache error:', error);
    }
  }

  static async invalidateTournament(tournament_id: string): Promise<void> {
    try {
      BrowserCache.removeItem(`tournament:${tournament_id}`);
      BrowserCache.removeItem(`leaderboard:${tournament_id}`);
    } catch (error) {
      console.error('Cache error:', error);
    }
  }

  static async clearAll(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Cache error:', error);
      throw new TournamentError('Failed to clear cache');
    }
  }
} 