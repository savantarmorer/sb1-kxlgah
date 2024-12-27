import { supabase } from '@/lib/supabase';
import { TournamentError } from '@/errors/TournamentError';
import { cache } from '@/lib/cache/redisCache';
import { SystemMetrics, LoadAnalysis, PerformanceMetrics, RetentionMetrics } from '@/types/tournament.TODO';

export class AnalyticsService {
  /**
   * Track tournament metrics
   */
  static async trackTournamentMetrics(tournament_id: string): Promise<void> {
    try {
      const metrics = await this.calculateTournamentMetrics(tournament_id);
      
      await supabase
        .from('tournament_metrics')
        .insert({
          tournament_id,
          timestamp: new Date().toISOString(),
          ...metrics
        });

      // Cache metrics
      await cache.set(
        `tournament_metrics:${tournament_id}`,
        metrics,
        60 * 5 // 5 minutes
      );
    } catch (error) {
      console.error('Error tracking tournament metrics:', error);
      throw new TournamentError('Failed to track tournament metrics');
    }
  }

  /**
   * Calculate tournament metrics
   */
  private static async calculateTournamentMetrics(tournament_id: string) {
    const { data: matches } = await supabase
      .from('tournament_matches')
      .select(`
        *,
        player1:players!player1_id(*),
        player2:players!player2_id(*)
      `)
      .eq('tournament_id', tournament_id);

    if (!matches) return null;

    const activePlayers = new Set();
    let totalDuration = 0;
    let matchesInProgress = 0;
    let errors = 0;

    matches.forEach(match => {
      if (match.player1) activePlayers.add(match.player1.id);
      if (match.player2) activePlayers.add(match.player2.id);
      
      if (match.status === 'in_progress') {
        matchesInProgress++;
      }
      
      if (match.end_time && match.start_time) {
        totalDuration += new Date(match.end_time).getTime() - 
                        new Date(match.start_time).getTime();
      }

      if (match.error_count) {
        errors += match.error_count;
      }
    });

    return {
      active_players: activePlayers.size,
      matches_in_progress: matchesInProgress,
      average_match_duration: matches.length ? totalDuration / matches.length : 0,
      error_rate: matches.length ? errors / matches.length : 0
    };
  }

  /**
   * Track system metrics
   */
  static async trackSystemMetrics(): Promise<void> {
    const metrics = await this.calculateSystemMetrics();
    
    await supabase
      .from('system_metrics')
      .insert({
        timestamp: new Date().toISOString(),
        ...metrics
      });
  }

  /**
   * Calculate system metrics
   */
  private static async calculateSystemMetrics(): Promise<SystemMetrics> {
    const { data: connections } = await supabase
      .rpc('get_active_connections');

    const { data: responseTime } = await supabase
      .rpc('get_average_response_time');

    return {
      cpu_usage: process.cpuUsage().user / 1000000, // Convert to seconds
      memory_usage: process.memoryUsage().heapUsed / 1024 / 1024, // Convert to MB
      active_connections: connections || 0,
      response_time: responseTime || 0,
      error_rate: await this.calculateErrorRate()
    };
  }

  /**
   * Calculate error rate
   */
  private static async calculateErrorRate(): Promise<number> {
    const { count: totalRequests } = await supabase
      .from('system_metrics')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', new Date(Date.now() - 3600000).toISOString()); // Last hour

    const { count: errorRequests } = await supabase
      .from('system_metrics')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', new Date(Date.now() - 3600000).toISOString())
      .gt('error_count', 0);

    return totalRequests ? (errorRequests || 0) / totalRequests : 0;
  }

  /**
   * Analyze system load
   */
  static async analyzeSystemLoad(): Promise<LoadAnalysis> {
    const { data: metrics } = await supabase
      .from('system_metrics')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 86400000).toISOString()); // Last 24 hours

    if (!metrics?.length) {
      throw new TournamentError('No metrics available for analysis');
    }

    const averageLoad = metrics.reduce((acc, m) => acc + m.cpu_usage, 0) / metrics.length;
    
    const peakTimes = metrics
      .filter(m => m.cpu_usage > averageLoad * 1.5)
      .map(m => new Date(m.timestamp).toISOString());

    const bottlenecks = this.identifyBottlenecks(metrics);

    return {
      average_load: averageLoad,
      peak_times: peakTimes,
      bottlenecks,
      recommendations: this.generateRecommendations(averageLoad, bottlenecks)
    };
  }

  /**
   * Identify system bottlenecks
   */
  private static identifyBottlenecks(metrics: SystemMetrics[]): string[] {
    const bottlenecks: string[] = [];

    const avgCpu = metrics.reduce((acc, m) => acc + m.cpu_usage, 0) / metrics.length;
    const avgMemory = metrics.reduce((acc, m) => acc + m.memory_usage, 0) / metrics.length;
    const avgConnections = metrics.reduce((acc, m) => acc + m.active_connections, 0) / metrics.length;

    if (avgCpu > 70) bottlenecks.push('High CPU usage');
    if (avgMemory > 80) bottlenecks.push('High memory usage');
    if (avgConnections > 1000) bottlenecks.push('High connection count');

    return bottlenecks;
  }

  /**
   * Generate system recommendations
   */
  private static generateRecommendations(
    averageLoad: number,
    bottlenecks: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (averageLoad > 70) {
      recommendations.push('Consider scaling up server resources');
    }

    if (bottlenecks.includes('High CPU usage')) {
      recommendations.push('Optimize database queries and implement caching');
    }

    if (bottlenecks.includes('High memory usage')) {
      recommendations.push('Implement memory limits and garbage collection');
    }

    if (bottlenecks.includes('High connection count')) {
      recommendations.push('Implement connection pooling and rate limiting');
    }

    return recommendations;
  }

  /**
   * Generate daily report
   */
  static async generateDailyReport(): Promise<{
    total_matches: number;
    active_users: number;
    system_health: SystemMetrics;
  }> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [matchCount, userCount, metrics] = await Promise.all([
      this.getTotalMatches(startOfDay),
      this.getActiveUsers(startOfDay),
      this.getLatestMetrics()
    ]);

    return {
      total_matches: matchCount,
      active_users: userCount,
      system_health: metrics
    };
  }

  /**
   * Get total matches for a period
   */
  private static async getTotalMatches(since: Date): Promise<number> {
    const { count } = await supabase
      .from('tournament_matches')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since.toISOString());

    return count || 0;
  }

  /**
   * Get active users for a period
   */
  private static async getActiveUsers(since: Date): Promise<number> {
    const { count } = await supabase
      .from('tournament_participants')
      .select('user_id', { count: 'exact', head: true })
      .gte('joined_at', since.toISOString());

    return count || 0;
  }

  /**
   * Get latest system metrics
   */
  private static async getLatestMetrics(): Promise<SystemMetrics> {
    const { data } = await supabase
      .from('system_metrics')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    return data as SystemMetrics;
  }
} 