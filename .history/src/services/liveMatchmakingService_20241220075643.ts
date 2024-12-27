import { supabase } from '../lib/supabase';
import { BATTLE_CONFIG } from '../config/battleConfig';
import type { Player } from '../types/battle';

interface MatchmakingQueue {
  userId: string;
  rating: number;
  level: number;
  joinedAt: number;
  preferences?: {
    mode?: 'casual' | 'ranked';
    category?: string;
  }
}

export class LiveMatchmakingService {
  private static channel = supabase.channel('matchmaking');
  private static queueTimeout = 60000; // 60 seconds timeout
  
  static async joinQueue(player: Player, preferences?: MatchmakingQueue['preferences']): Promise<void> {
    const queueEntry: MatchmakingQueue = {
      userId: player.id,
      rating: player.rating,
      level: player.level,
      joinedAt: Date.now(),
      preferences
    };

    // Join the matchmaking channel
    await this.channel
      .on('presence', { event: 'sync' }, () => this.handleQueueSync())
      .on('presence', { event: 'join' }, ({ key, newPresences }) => this.handlePlayerJoin(newPresences))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.channel.track(queueEntry);
        }
      });
  }

  static async leaveQueue(userId: string): Promise<void> {
    await this.channel.untrack();
    await this.channel.unsubscribe();
  }

  private static async handleQueueSync(): Promise<void> {
    const presences = this.channel.presenceState();
    await this.matchPlayers(Object.values(presences).flat());
  }

  private static async handlePlayerJoin(newPresences: MatchmakingQueue[]): Promise<void> {
    await this.matchPlayers(newPresences);
  }

  private static async matchPlayers(players: MatchmakingQueue[]): Promise<void> {
    const sortedPlayers = players.sort((a, b) => a.joinedAt - b.joinedAt);
    
    for (let i = 0; i < sortedPlayers.length - 1; i++) {
      const player1 = sortedPlayers[i];
      const player2 = sortedPlayers[i + 1];

      if (this.arePlayersCompatible(player1, player2)) {
        await this.createMatch(player1, player2);
        // Remove matched players from queue
        await Promise.all([
          this.leaveQueue(player1.userId),
          this.leaveQueue(player2.userId)
        ]);
      }
    }
  }

  private static arePlayersCompatible(player1: MatchmakingQueue, player2: MatchmakingQueue): boolean {
    const ratingDiff = Math.abs(player1.rating - player2.rating);
    const levelDiff = Math.abs(player1.level - player2.level);
    const timeInQueue = Date.now() - Math.min(player1.joinedAt, player2.joinedAt);
    
    // Expand matching criteria based on time in queue
    const maxRatingDiff = 200 + Math.floor(timeInQueue / 10000) * 50; // Increase by 50 every 10 seconds
    const maxLevelDiff = 2 + Math.floor(timeInQueue / 15000); // Increase by 1 every 15 seconds

    return (
      ratingDiff <= maxRatingDiff &&
      levelDiff <= maxLevelDiff &&
      player1.preferences?.mode === player2.preferences?.mode &&
      player1.preferences?.category === player2.preferences?.category
    );
  }

  private static async createMatch(player1: MatchmakingQueue, player2: MatchmakingQueue): Promise<void> {
    const matchId = `match_${Date.now()}`;
    
    // Create a new battle room channel
    const battleChannel = supabase.channel(`battle:${matchId}`);
    
    // Notify both players
    await Promise.all([
      this.notifyPlayer(player1.userId, matchId, player2),
      this.notifyPlayer(player2.userId, matchId, player1)
    ]);
  }

  private static async notifyPlayer(userId: string, matchId: string, opponent: MatchmakingQueue): Promise<void> {
    await supabase
      .from('battle_matches')
      .insert({
        match_id: matchId,
        user_id: userId,
        opponent_id: opponent.userId,
        status: 'matched',
        created_at: new Date().toISOString()
      });
  }
}
