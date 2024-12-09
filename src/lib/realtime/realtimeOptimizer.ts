import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { TournamentMetrics } from '@/monitoring/metrics';

// Add MatchUpdate type
interface MatchUpdate {
  type: string;
  data: any; // Define specific type based on your needs
}

type RealtimeStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR';

export class RealtimeOptimizer {
  private static channels: Map<string, RealtimeChannel> = new Map();

  static subscribeToMatch(
    matchId: string,
    callback: (payload: MatchUpdate) => void
  ): RealtimeChannel {
    const existingChannel = this.channels.get(matchId);
    if (existingChannel) {
      return existingChannel;
    }

    // Create new channel
    const channel = supabase.channel(`match:${matchId}`);
    this.channels.set(matchId, channel);
    
    channel.subscribe((status: RealtimeStatus) => {
      if (status === 'SUBSCRIBED') {
        // Log connection instead of using metrics
        console.log(`Match ${matchId} connected`);
      }
    });

    return channel;
  }
} 