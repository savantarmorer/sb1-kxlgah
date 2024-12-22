import { supabase } from '../lib/supabase';
import { BATTLE_CONFIG } from '../config/battleConfig';
import type { Player } from '../types/battle';
import { RealtimeChannel } from '@supabase/supabase-js';

interface MatchmakingQueue {
  userId: string;
  rating: number;
  level: number;
  joinedAt: number;
  preferences?: {
    mode?: 'casual' | 'ranked';
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }
}

interface MatchmakingState {
  status: 'searching' | 'matched' | 'ready' | 'error';
  matchId?: string;
  opponent?: Player;
  error?: string;
}

export class LiveMatchmakingService {
  private static channel: RealtimeChannel;
  private static queueTimeout = 60000; // 60 seconds timeout
  private static matchStateListeners: Map<string, (state: MatchmakingState) => void> = new Map();
  private static activeMatches: Map<string, { player1: string; player2: string }> = new Map();
  
  /**
   * Join the matchmaking queue
   */
  static async joinQueue(
    player: Player, 
    preferences?: MatchmakingQueue['preferences'],
    onStateChange?: (state: MatchmakingState) => void
  ): Promise<void> {
    try {
      // Store the state change listener
      if (onStateChange) {
        this.matchStateListeners.set(player.id, onStateChange);
      }

      const queueEntry: MatchmakingQueue = {
        userId: player.id,
        rating: player.rating,
        level: player.level,
        joinedAt: Date.now(),
        preferences
      };

      // Create and join the matchmaking channel
      this.channel = supabase.channel('matchmaking');

      // Set up channel listeners
      await this.channel
        .on('presence', { event: 'sync' }, () => this.handleQueueSync())
        .on('presence', { event: 'join' }, ({ newPresences }) => this.handlePlayerJoin(newPresences))
        .on('presence', { event: 'leave' }, () => this.handleQueueSync())
        .on('broadcast', { event: 'match_found' }, ({ payload }) => this.handleMatchFound(payload))
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await this.channel.track(queueEntry);
            this.notifyStateChange(player.id, { status: 'searching' });
          }
        });

      // Set up queue timeout
      setTimeout(() => this.handleQueueTimeout(player.id), this.queueTimeout);

    } catch (error) {
      console.error('Error joining matchmaking queue:', error);
      this.notifyStateChange(player.id, { 
        status: 'error', 
        error: 'Failed to join matchmaking queue' 
      });
      throw error;
    }
  }

  /**
   * Leave the matchmaking queue
   */
  static async leaveQueue(userId: string): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.untrack();
        await this.channel.unsubscribe();
      }
      this.matchStateListeners.delete(userId);
    } catch (error) {
      console.error('Error leaving matchmaking queue:', error);
    }
  }

  /**
   * Handle queue synchronization
   */
  private static async handleQueueSync(): Promise<void> {
    const presences = this.channel.presenceState();
    await this.matchPlayers(Object.values(presences).flat());
  }

  /**
   * Handle new player joining the queue
   */
  private static async handlePlayerJoin(newPresences: MatchmakingQueue[]): Promise<void> {
    await this.matchPlayers(newPresences);
  }

  /**
   * Match players based on criteria
   */
  private static async matchPlayers(players: MatchmakingQueue[]): Promise<void> {
    const sortedPlayers = players.sort((a, b) => a.joinedAt - b.joinedAt);
    
    for (let i = 0; i < sortedPlayers.length - 1; i++) {
      const player1 = sortedPlayers[i];
      const player2 = sortedPlayers[i + 1];

      if (this.arePlayersCompatible(player1, player2)) {
        const matchId = await this.createMatch(player1, player2);
        
        if (matchId) {
          // Broadcast match found event to both players
          this.channel.send({
            type: 'broadcast',
            event: 'match_found',
            payload: {
              matchId,
              players: [player1.userId, player2.userId]
            }
          });
        }
      }
    }
  }

  /**
   * Check if players are compatible for matching
   */
  private static arePlayersCompatible(player1: MatchmakingQueue, player2: MatchmakingQueue): boolean {
    // Don't match the same player
    if (player1.userId === player2.userId) return false;

    // Don't match players already in a match
    if (this.isPlayerInMatch(player1.userId) || this.isPlayerInMatch(player2.userId)) {
      return false;
    }

    const ratingDiff = Math.abs(player1.rating - player2.rating);
    const levelDiff = Math.abs(player1.level - player2.level);
    const timeInQueue = Date.now() - Math.min(player1.joinedAt, player2.joinedAt);
    
    // Expand matching criteria based on time in queue
    const maxRatingDiff = 200 + Math.floor(timeInQueue / 10000) * 50; // Increase by 50 every 10 seconds
    const maxLevelDiff = 2 + Math.floor(timeInQueue / 15000); // Increase by 1 every 15 seconds

    // Check preferences match
    const preferencesMatch = 
      player1.preferences?.mode === player2.preferences?.mode &&
      player1.preferences?.category === player2.preferences?.category &&
      (!player1.preferences?.difficulty || !player2.preferences?.difficulty || 
       player1.preferences.difficulty === player2.preferences.difficulty);

    return (
      ratingDiff <= maxRatingDiff &&
      levelDiff <= maxLevelDiff &&
      preferencesMatch
    );
  }

  /**
   * Create a match between two players
   */
  private static async createMatch(player1: MatchmakingQueue, player2: MatchmakingQueue): Promise<string | null> {
    try {
      const matchId = `match_${Date.now()}`;
      
      // Create battle match records
      const { error } = await supabase
        .from('battle_matches')
        .insert([
          {
            match_id: matchId,
            user_id: player1.userId,
            opponent_id: player2.userId,
            status: 'matched',
            created_at: new Date().toISOString()
          },
          {
            match_id: matchId,
            user_id: player2.userId,
            opponent_id: player1.userId,
            status: 'matched',
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      // Store active match
      this.activeMatches.set(matchId, {
        player1: player1.userId,
        player2: player2.userId
      });

      // Update state for both players
      this.notifyStateChange(player1.userId, {
        status: 'matched',
        matchId,
        opponent: await this.fetchPlayerDetails(player2.userId)
      });

      this.notifyStateChange(player2.userId, {
        status: 'matched',
        matchId,
        opponent: await this.fetchPlayerDetails(player1.userId)
      });

      return matchId;
    } catch (error) {
      console.error('Error creating match:', error);
      return null;
    }
  }

  /**
   * Handle match found event
   */
  private static async handleMatchFound(payload: { matchId: string; players: string[] }): Promise<void> {
    const { matchId, players } = payload;
    
    // Remove players from queue
    await Promise.all(players.map(playerId => this.leaveQueue(playerId)));
    
    // Create battle room channel
    const battleChannel = supabase.channel(`battle:${matchId}`);
    await battleChannel.subscribe();
  }

  /**
   * Handle queue timeout
   */
  private static async handleQueueTimeout(userId: string): Promise<void> {
    const presence = this.channel.presenceState();
    const isStillInQueue = Object.values(presence)
      .flat()
      .some((p: any) => p.userId === userId);

    if (isStillInQueue) {
      this.notifyStateChange(userId, {
        status: 'error',
        error: 'Matchmaking timeout. Please try again.'
      });
      await this.leaveQueue(userId);
    }
  }

  /**
   * Notify state change to listener
   */
  private static notifyStateChange(userId: string, state: MatchmakingState): void {
    const listener = this.matchStateListeners.get(userId);
    if (listener) {
      listener(state);
    }
  }

  /**
   * Check if player is in an active match
   */
  private static isPlayerInMatch(userId: string): boolean {
    return Array.from(this.activeMatches.values()).some(
      match => match.player1 === userId || match.player2 === userId
    );
  }

  /**
   * Fetch player details
   */
  private static async fetchPlayerDetails(userId: string): Promise<Player | undefined> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, level, battle_rating, avatar_url, streak')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        level: data.level,
        rating: data.battle_rating,
        avatar_url: data.avatar_url,
        streak: data.streak
      };
    } catch (error) {
      console.error('Error fetching player details:', error);
      return undefined;
    }
  }
}
