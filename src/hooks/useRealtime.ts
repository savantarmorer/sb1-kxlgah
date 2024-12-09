import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimePayload<T = any> {
  new: T;
  old: T;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

export function useRealtime<T = any>(
  channel: string,
  callback: (payload: RealtimePayload<T>) => void
) {
  useEffect(() => {
    const [table, filter] = channel.split(':');
    
    const subscription = supabase
      .channel('any')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: filter ? `${filter}` : undefined
        },
        (payload) => {
          callback(payload as RealtimePayload<T>);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channel, callback]);
} 