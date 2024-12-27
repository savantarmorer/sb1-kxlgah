import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TournamentMetrics } from '@/monitoring/metrics';

export function useFeedback() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitFeedback = async <T extends { [key: string]: any }>(feedback: T) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Salvar no banco
      const { error: dbError } = await supabase
        .from('feedback')
        .insert(feedback);

      if (dbError) throw dbError;

      // Registrar métricas
      await TournamentMetrics.recordFeedbackMetrics({
        type: 'match_id' in feedback ? 'match' : 'tournament',
        rating: feedback.rating || feedback.overall_experience,
        timestamp: new Date().toISOString()
      });

      // Análise em tempo real
      if (feedback.rating <= 2 || feedback.overall_experience <= 2) {
        await TournamentMetrics.recordNegativeFeedbackAlert({
          id: feedback.match_id || feedback.tournament_id,
          issues: feedback.issues || [],
          comments: feedback.comments || feedback.suggestions
        });
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitFeedback,
    isSubmitting,
    error
  };
} 