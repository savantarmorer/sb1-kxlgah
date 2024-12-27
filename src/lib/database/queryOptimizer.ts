import { supabase } from '@/lib/supabase';
import { cache } from '@/lib/cache/redisCache';
import { TournamentMetrics } from '@/monitoring/metrics';
import { TournamentError } from '@/errors/TournamentError';
import { Logger } from '@/utils/logger';
import { Tournament } from '@/types/tournament';

const logger = new Logger('QueryOptimizer');

export class QueryOptimizer {
  static async getTournamentData(tournamentId: string): Promise<Tournament | null> {
    try {
      const cacheKey = `tournament:${tournamentId}`;
      
      // Tentar cache primeiro
      const cached = await cache.get<Tournament>(cacheKey);
      if (cached) return cached;

      // Query otimizada com joins necessários
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          matches:tournament_matches(
            id,
            status,
            player1:players!player1_id(*),
            player2:players!player2_id(*)
          ),
          participants:tournament_participants(
            player:players(*)
          )
        `)
        .eq('id', tournamentId)
        .single();

      if (error) throw error;

      // Salvar no cache
      await cache.set(cacheKey, data);
      
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching tournament data:', { error: errorMessage });
      throw new TournamentError('Failed to fetch tournament data');
    }
  }

  static async getMatchesInProgress() {
    const cacheKey = 'matches:in_progress';
    
    // Usar cache com TTL curto
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    // Query otimizada
    const { data, error } = await supabase
      .from('matches')
      .select(`
        id,
        status,
        score,
        tournament:tournaments!tournament_id(
          id,
          title
        )
      `)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Cache curto para dados ativos
    await cache.set(cacheKey, data, 30); // 30 segundos
    
    return data;
  }

  static async updateMatchScore(matchId: string, score: number) {
    // Invalidar caches relacionados
    await cache.invalidate(`match:${matchId}*`);
    await cache.invalidate('matches:in_progress');

    const { error } = await supabase
      .from('matches')
      .update({ score })
      .eq('id', matchId);

    if (error) throw error;

    // Registrar métrica de atualização
    await TournamentMetrics.recordMatchMetrics({
      match_id: matchId,
      score,
      timestamp: new Date()
    });
  }
} 