import { supabase } from '../lib/supabase.ts';

export async function savePerformanceMetric(data: {
  context: string;
  duration: number;
  metadata?: Record<string, any>;
}) {
  try {
    const { error } = await supabase
      .from('performance_metrics')
      .insert({
        user_id: supabase.auth.user()?.id,
        context: data.context,
        duration: data.duration,
        metadata: data.metadata,
        timestamp: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving performance metric:', error);
  }
}
