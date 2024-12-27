import { supabase } from '@/lib/supabase';
import { 
  SystemMetrics, 
  LoadAnalysis, 
  PerformanceMetrics, 
  RetentionMetrics,
  UserBehaviorReport,
  AnomalyReport,
  DailyReport,
  WeeklyReport
} from '@/types/tournament.TODO';
import { TournamentError } from '@/errors/TournamentError';

export class MetricsService {
  /**
   * Analyze match duration metrics
   */
  static async analyzeMatchDuration(tournament_id: string): Promise<PerformanceMetrics> {
    try {
      const { data: matches } = await supabase
        .from('tournament_matches')
        .select('start_time, end_time, status')
        .eq('tournament_id', tournament_id)
        .eq('status', 'completed');

      if (!matches?.length) {
        throw new TournamentError('No completed matches found');
      }

      const durations = matches.map(m => {
        const start = new Date(m.start_time).getTime();
        const end = new Date(m.end_time).getTime();
        return (end - start) / 1000; // Convert to seconds
      });

      const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const completionRate = (matches.length / (matches.length + matches.filter(m => m.status === 'cancelled').length)) * 100;

      const errorFrequency: Record<string, number> = {};
      matches.forEach(m => {
        if (m.error_type) {
          errorFrequency[m.error_type] = (errorFrequency[m.error_type] || 0) + 1;
        }
      });

      return {
        average_duration: averageDuration,
        completion_rate: completionRate,
        error_frequency: errorFrequency
      };
    } catch (error) {
      console.error('Error analyzing match duration:', error);
      throw new TournamentError('Failed to analyze match duration');
    }
  }

  /**
   * Analyze player retention
   */
  static async analyzePlayerRetention(): Promise<RetentionMetrics> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
      const [monthlyActive, weeklyActive, dailyActive] = await Promise.all([
        this.getActiveUsers(thirtyDaysAgo),
        this.getActiveUsers(sevenDaysAgo),
        this.getActiveUsers(oneDayAgo)
      ]);

      const { data: totalUsers } = await supabase
        .from('players')
        .select('id', { count: 'exact', head: true });

      const churnRate = ((totalUsers - monthlyActive) / totalUsers) * 100;

      return {
        daily_active_users: dailyActive,
        weekly_active_users: weeklyActive,
        monthly_active_users: monthlyActive,
        churn_rate: churnRate
      };
    } catch (error) {
      console.error('Error analyzing player retention:', error);
      throw new TournamentError('Failed to analyze player retention');
    }
  }

  /**
   * Analyze system load
   */
  static async analyzeSystemLoad(timeframe: string): Promise<LoadAnalysis> {
    try {
      const { data: metrics } = await supabase
        .from('system_metrics')
        .select('*')
        .gte('timestamp', this.getTimeframeStart(timeframe))
        .order('timestamp', { ascending: true });

      if (!metrics?.length) {
        throw new TournamentError('No metrics data available');
      }

      const averageLoad = metrics.reduce((acc, m) => acc + m.cpu_usage, 0) / metrics.length;
      const peakTimes = this.findPeakTimes(metrics);
      const bottlenecks = this.findBottlenecks(metrics);

      return {
        average_load: averageLoad,
        peak_times: peakTimes,
        bottlenecks: bottlenecks,
        recommendations: this.generateRecommendations(averageLoad, bottlenecks)
      };
    } catch (error) {
      console.error('Error analyzing system load:', error);
      throw new TournamentError('Failed to analyze system load');
    }
  }

  /**
   * Generate daily report
   */
  static async generateDailyReport(): Promise<DailyReport> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const [totalMatches, activeUsers, systemHealth] = await Promise.all([
        this.getTotalMatches(today),
        this.getActiveUsers(today),
        this.getSystemHealth()
      ]);

      return {
        date: today.toISOString(),
        metrics: {
          total_matches,
          active_users: activeUsers,
          system_health: systemHealth
        }
      };
    } catch (error) {
      console.error('Error generating daily report:', error);
      throw new TournamentError('Failed to generate daily report');
    }
  }

  /**
   * Generate weekly report
   */
  static async generateWeeklyReport(): Promise<WeeklyReport> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    try {
      const [dailyReport, trends, feedback] = await Promise.all([
        this.generateDailyReport(),
        this.getWeeklyTrends(),
        this.getWeeklyFeedback()
      ]);

      return {
        ...dailyReport,
        weeklyTrends: trends,
        userFeedbackSummary: feedback
      };
    } catch (error) {
      console.error('Error generating weekly report:', error);
      throw new TournamentError('Failed to generate weekly report');
    }
  }

  private static getTimeframeStart(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  private static findPeakTimes(metrics: SystemMetrics[]): string[] {
    const threshold = 80; // 80% CPU usage
    return metrics
      .filter(m => m.cpu_usage > threshold)
      .map(m => new Date(m.timestamp).toISOString());
  }

  private static findBottlenecks(metrics: SystemMetrics[]): string[] {
    const bottlenecks: string[] = [];
    
    if (metrics.some(m => m.cpu_usage > 90)) {
      bottlenecks.push('High CPU usage');
    }
    if (metrics.some(m => m.memory_usage > 90)) {
      bottlenecks.push('High memory usage');
    }
    if (metrics.some(m => m.error_rate > 5)) {
      bottlenecks.push('High error rate');
    }
    if (metrics.some(m => m.response_time > 1000)) {
      bottlenecks.push('High response time');
    }

    return bottlenecks;
  }

  private static generateRecommendations(averageLoad: number, bottlenecks: string[]): string[] {
    const recommendations: string[] = [];

    if (averageLoad > 70) {
      recommendations.push('Consider scaling up server resources');
    }
    if (bottlenecks.includes('High CPU usage')) {
      recommendations.push('Optimize CPU-intensive operations');
    }
    if (bottlenecks.includes('High memory usage')) {
      recommendations.push('Implement better memory management');
    }
    if (bottlenecks.includes('High error rate')) {
      recommendations.push('Investigate and fix error sources');
    }
    if (bottlenecks.includes('High response time')) {
      recommendations.push('Optimize database queries and caching');
    }

    return recommendations;
  }

  private static async getActiveUsers(since: Date): Promise<number> {
    const { count } = await supabase
      .from('tournament_participants')
      .select('user_id', { count: 'exact', head: true })
      .gte('last_active', since.toISOString());

    return count || 0;
  }

  private static async getTotalMatches(since: Date): Promise<number> {
    const { count } = await supabase
      .from('tournament_matches')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since.toISOString());

    return count || 0;
  }

  private static async getSystemHealth(): Promise<any> {
    const { data: metrics } = await supabase
      .from('system_metrics')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    return {
      status: this.getHealthStatus(metrics),
      issues: this.getHealthIssues(metrics),
      metrics
    };
  }

  private static getHealthStatus(metrics: SystemMetrics): 'healthy' | 'degraded' | 'critical' {
    if (metrics.error_rate > 10 || metrics.cpu_usage > 90) {
      return 'critical';
    }
    if (metrics.error_rate > 5 || metrics.cpu_usage > 70) {
      return 'degraded';
    }
    return 'healthy';
  }

  private static getHealthIssues(metrics: SystemMetrics): any[] {
    const issues = [];
    
    if (metrics.cpu_usage > 70) {
      issues.push({
        component: 'CPU',
        status: metrics.cpu_usage > 90 ? 'critical' : 'warning',
        message: `High CPU usage: ${metrics.cpu_usage}%`
      });
    }

    if (metrics.error_rate > 5) {
      issues.push({
        component: 'Error Rate',
        status: metrics.error_rate > 10 ? 'critical' : 'warning',
        message: `High error rate: ${metrics.error_rate}%`
      });
    }

    return issues;
  }

  private static async getWeeklyTrends(): Promise<any> {
    // Implementation would compare current week's metrics with previous week
    return {
      user_growth: 0,
      engagement_rate: 0,
      retention_rate: 0,
      satisfaction_score: 0
    };
  }

  private static async getWeeklyFeedback(): Promise<any> {
    // Implementation would aggregate feedback from the past week
    return {
      average_rating: 0,
      total_responses: 0,
      sentiment_analysis: {
        positive: 0,
        neutral: 0,
        negative: 0
      },
      common_feedback: []
    };
  }
} 