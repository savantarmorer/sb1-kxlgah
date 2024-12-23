import { supabase } from '../lib/supabase';
import { BATTLE_CONFIG } from '../config/battleConfig';
import { BattleStatus, MatchState } from '../types/battle';

interface MatchmakingPreferences {
  mode?: 'casual' | 'ranked';
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface QueuePlayer {
  id: string;
  rating: number;
  level: number;
  preferences?: MatchmakingPreferences;
}

export class LiveMatchmakingService {
  private static instance: LiveMatchmakingService;
  private channel: any;
  private stateListeners: ((state: MatchState) => void)[] = [];

  constructor() {
    if (LiveMatchmakingService.instance) {
      return LiveMatchmakingService.instance;
    }
    LiveMatchmakingService.instance = this;
  }

  public subscribeToMatchUpdates(callback: (state: MatchState) => void) {
    this.stateListeners.push(callback);
  }

  public async joinMatchmakingQueue(
    userId: string,
    player: QueuePlayer
  ): Promise<void> {
    try {
      // Join the matchmaking channel
      this.channel = supabase.channel(`matchmaking:${userId}`);

      // Subscribe to matchmaking events
      this.channel
        .on('presence', { event: 'sync' }, () => {
          this.notifyListeners({
            status: BattleStatus.SEARCHING
          });
        })
        .on('presence', { event: 'join' }, ({ newPresences }: any) => {
          console.log('New players joined:', newPresences);
        })
        .on('broadcast', { event: 'match_found' }, ({ payload }: any) => {
          this.notifyListeners({
            status: BattleStatus.MATCHED,
            matchId: payload.matchId,
            opponent: payload.opponent
          });
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            await this.channel.track({
              user_id: userId,
              ...player
            });
          }
        });

    } catch (error) {
      console.error('Error joining matchmaking queue:', error);
      this.notifyListeners({
        status: BattleStatus.ERROR,
        error: 'Failed to join matchmaking queue'
      });
      throw error;
    }
  }

  public async leaveMatchmakingQueue(userId: string): Promise<void> {
    if (this.channel) {
      await this.channel.untrack();
      await this.channel.unsubscribe();
    }
  }

  private notifyListeners(state: MatchState) {
    this.stateListeners.forEach(listener => listener(state));
  }
}
