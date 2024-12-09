import { Logger, LogLevel } from './logger';

interface PerformanceMetric {
  duration: number;
  [key: string]: any;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private logger: Logger;

  constructor() {
    this.logger = new Logger('PerformanceMonitor');
  }

  /**
   * Get current high-resolution timestamp
   * @returns {number} Current timestamp in milliseconds
   */
  static now(): number {
    return performance.now();
  }

  static async measure<T>(
    context: string, 
    fn: () => Promise<T>, 
    thresholdMs: number = 1000
  ): Promise<T> {
    const start = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - start;

      // Log performance if exceeds threshold
      if (duration > thresholdMs) {
        Logger.log({
          level: LogLevel.WARN,
          context: `Performance:${context}`,
          message: `Slow operation detected`,
          metadata: {
            duration,
            threshold: thresholdMs
          }
        });
      }

      // Optional: Send performance metrics
      await PerformanceMonitor.sendPerformanceMetrics(context, duration);

      return result;
    } catch (error) {
      // Log any errors during performance measurement
      Logger.log({
        level: LogLevel.ERROR,
        context: `Performance:${context}`,
        message: 'Performance measurement failed',
        metadata: {
          error: error instanceof Error ? error.message : String(error)
        },
        errorStack: error instanceof Error ? error.stack : undefined
      });

      throw error;
    }
  }

  private static async sendPerformanceMetrics(context: string, duration: number) {
    // In development, just log to console
    if (process.env.NODE_ENV === 'development') {
      console.debug('Performance metric:', { context, duration, timestamp: new Date().toISOString() });
      return;
    }

    try {
      await fetch('/api/performance-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, duration, timestamp: new Date().toISOString() })
      });
    } catch (err) {
      console.error('Failed to send performance metrics', err);
    }
  }

  recordMetric(metricName: string, data: PerformanceMetric) {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }
    
    this.metrics.get(metricName)!.push(data);
    
    this.logger.debug(`Performance metric recorded: ${metricName}`, data);
    
    // Optional: Send metrics to monitoring service
    this.sendMetricsToService(metricName, data);
  }

  getMetrics(metricName?: string): { [key: string]: PerformanceMetric[] } {
    if (metricName) {
      return { [metricName]: this.metrics.get(metricName) || [] };
    }
    return Object.fromEntries(this.metrics);
  }

  clearMetrics(metricName?: string) {
    if (metricName) {
      this.metrics.delete(metricName);
    } else {
      this.metrics.clear();
    }
  }

  private async sendMetricsToService(metricName: string, data: PerformanceMetric) {
    try {
      await fetch('/api/performance-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric: metricName,
          timestamp: new Date().toISOString(),
          ...data
        })
      });
    } catch (error) {
      this.logger.warn('Failed to send performance metrics', { error });
    }
  }

  // Método para calcular estatísticas de performance
  static calculatePerformanceStats(measurements: number[]): {
    average: number;
    median: number;
    max: number;
    min: number;
  } {
    if (measurements.length === 0) {
      return { average: 0, median: 0, max: 0, min: 0 };
    }

    measurements.sort((a, b) => a - b);

    return {
      average: measurements.reduce((a, b) => a + b, 0) / measurements.length,
      median: measurements[Math.floor(measurements.length / 2)],
      max: Math.max(...measurements),
      min: Math.min(...measurements)
    };
  }
}
