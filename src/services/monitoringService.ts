import { supabase } from '@/lib/supabase';
import { TournamentError } from '@/errors/TournamentError';
import { SystemHealth, SystemMetrics, AnomalyReport, FeedbackSummary } from '@/types/tournament.TODO';
import { cache } from '@/lib/cache/redisCache';

export class MonitoringService {
  private static readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute
  private static readonly METRICS_RETENTION = 86400000; // 24 hours

  /**
   * Start monitoring system health
   */
  static startHealthCheck(): void {
    setInterval(async () => {
      try {
        await this.checkSystemHealth();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Check system health
   */
  static async checkSystemHealth(): Promise<SystemHealth> {
    try {
      const metrics = await this.gatherMetrics();
      const issues = await this.identifyIssues(metrics);
      const status = this.determineSystemStatus(issues);

      const health: SystemHealth = {
        status,
        issues,
        metrics
      };

      // Store health status
      await supabase
        .from('system_health')
        .insert({
          timestamp: new Date().toISOString(),
          status,
          metrics,
          issues
        });

      // Cache current health
      await cache.set('system_health', health, 60); // 1 minute

      return health;
    } catch (error) {
      console.error('Error checking system health:', error);
      throw new TournamentError('Failed to check system health');
    }
  }

  /**
   * Gather system metrics
   */
  private static async gatherMetrics(): Promise<SystemMetrics> {
    const [cpuUsage, memoryUsage] = await Promise.all([
      this.getCpuUsage(),
      this.getMemoryUsage()
    ]);

    const { data: connections } = await supabase
      .rpc('get_active_connections');

    const { data: responseTime } = await supabase
      .rpc('get_average_response_time');

    return {
      cpu_usage: cpuUsage,
      memory_usage: memoryUsage,
      active_connections: connections || 0,
      response_time: responseTime || 0,
      error_rate: await this.calculateErrorRate()
    };
  }

  /**
   * Get CPU usage
   */
  private static async getCpuUsage(): Promise<number> {
    const startUsage = process.cpuUsage();
    await new Promise(resolve => setTimeout(resolve, 100));
    const endUsage = process.cpuUsage(startUsage);
    
    return (endUsage.user + endUsage.system) / 1000000; // Convert to seconds
  }

  /**
   * Get memory usage
   */
  private static async getMemoryUsage(): Promise<number> {
    const used = process.memoryUsage();
    return Math.round(used.heapUsed / 1024 / 1024); // Convert to MB
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
   * Identify system issues
   */
  private static async identifyIssues(metrics: SystemMetrics): Promise<Array<{
    component: string;
    status: string;
    message: string;
  }>> {
    const issues: Array<{
      component: string;
      status: string;
      message: string;
    }> = [];

    // Check CPU usage
    if (metrics.cpu_usage > 90) {
      issues.push({
        component: 'CPU',
        status: 'critical',
        message: 'CPU usage is critically high'
      });
    } else if (metrics.cpu_usage > 70) {
      issues.push({
        component: 'CPU',
        status: 'warning',
        message: 'CPU usage is high'
      });
    }

    // Check memory usage
    if (metrics.memory_usage > 90) {
      issues.push({
        component: 'Memory',
        status: 'critical',
        message: 'Memory usage is critically high'
      });
    } else if (metrics.memory_usage > 70) {
      issues.push({
        component: 'Memory',
        status: 'warning',
        message: 'Memory usage is high'
      });
    }

    // Check response time
    if (metrics.response_time > 1000) {
      issues.push({
        component: 'Response Time',
        status: 'critical',
        message: 'Response time is critically high'
      });
    } else if (metrics.response_time > 500) {
      issues.push({
        component: 'Response Time',
        status: 'warning',
        message: 'Response time is high'
      });
    }

    // Check error rate
    if (metrics.error_rate > 0.1) {
      issues.push({
        component: 'Error Rate',
        status: 'critical',
        message: 'Error rate is critically high'
      });
    } else if (metrics.error_rate > 0.05) {
      issues.push({
        component: 'Error Rate',
        status: 'warning',
        message: 'Error rate is high'
      });
    }

    return issues;
  }

  /**
   * Determine system status
   */
  private static determineSystemStatus(
    issues: Array<{ status: string }>
  ): 'healthy' | 'degraded' | 'critical' {
    if (issues.some(issue => issue.status === 'critical')) {
      return 'critical';
    }

    if (issues.some(issue => issue.status === 'warning')) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Detect system anomalies
   */
  static async detectAnomalies(): Promise<AnomalyReport> {
    const { data: metrics } = await supabase
      .from('system_metrics')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (!metrics?.length) {
      throw new TournamentError('No metrics available for anomaly detection');
    }

    const anomalies: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      timestamp: string;
    }> = [];

    // Analyze metrics for anomalies
    metrics.forEach((metric, index) => {
      if (index === 0) return;

      const previousMetric = metrics[index - 1];

      // Check for sudden spikes
      if (metric.cpu_usage > previousMetric.cpu_usage * 2) {
        anomalies.push({
          type: 'cpu_spike',
          severity: 'high',
          description: 'Sudden CPU usage spike detected',
          timestamp: metric.timestamp
        });
      }

      if (metric.memory_usage > previousMetric.memory_usage * 1.5) {
        anomalies.push({
          type: 'memory_spike',
          severity: 'medium',
          description: 'Sudden memory usage increase detected',
          timestamp: metric.timestamp
        });
      }

      if (metric.error_rate > previousMetric.error_rate * 3) {
        anomalies.push({
          type: 'error_spike',
          severity: 'high',
          description: 'Sudden increase in error rate detected',
          timestamp: metric.timestamp
        });
      }
    });

    return {
      detected_anomalies: anomalies,
      recommendations: this.generateAnomalyRecommendations(anomalies)
    };
  }

  /**
   * Generate recommendations based on anomalies
   */
  private static generateAnomalyRecommendations(
    anomalies: Array<{ type: string; severity: string }>
  ): string[] {
    const recommendations: string[] = [];

    const hasCpuSpike = anomalies.some(a => a.type === 'cpu_spike');
    const hasMemorySpike = anomalies.some(a => a.type === 'memory_spike');
    const hasErrorSpike = anomalies.some(a => a.type === 'error_spike');

    if (hasCpuSpike) {
      recommendations.push(
        'Implement CPU usage limits',
        'Optimize resource-intensive operations',
        'Consider scaling infrastructure'
      );
    }

    if (hasMemorySpike) {
      recommendations.push(
        'Implement memory limits',
        'Check for memory leaks',
        'Optimize caching strategy'
      );
    }

    if (hasErrorSpike) {
      recommendations.push(
        'Review error logs',
        'Implement circuit breakers',
        'Add error recovery mechanisms'
      );
    }

    return recommendations;
  }

  /**
   * Clean up old metrics
   */
  static async cleanupOldMetrics(): Promise<void> {
    const cutoff = new Date(Date.now() - this.METRICS_RETENTION);

    await supabase
      .from('system_metrics')
      .delete()
      .lt('timestamp', cutoff.toISOString());
  }
} 