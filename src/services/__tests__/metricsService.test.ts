import { MetricsService } from '../metricsService';
import { generateMetricsTestData } from '@/utils/test/tournamentTestUtils';
import { supabase } from '@/lib/supabase';
import { TournamentError } from '@/errors/TournamentError';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

describe('MetricsService', () => {
  const { systemMetrics, performanceMetrics, retentionMetrics, loadAnalysis } = generateMetricsTestData();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeMatchDuration', () => {
    it('should analyze match duration metrics', async () => {
      const mockMatches = [
        { start_time: '2023-01-01T10:00:00Z', end_time: '2023-01-01T10:04:00Z', status: 'completed' },
        { start_time: '2023-01-01T11:00:00Z', end_time: '2023-01-01T11:04:00Z', status: 'completed' }
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockMatches, error: null })
        })
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      const result = await MetricsService.analyzeMatchDuration('test-tournament');

      expect(result).toEqual({
        average_duration: 240,
        completion_rate: 100,
        error_frequency: {}
      });
    });

    it('should throw error when no matches found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      await expect(MetricsService.analyzeMatchDuration('test-tournament'))
        .rejects
        .toThrow(TournamentError);
    });
  });

  describe('analyzePlayerRetention', () => {
    it('should analyze player retention metrics', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          count: jest.fn().mockResolvedValue({ count: 100, error: null })
        })
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      const result = await MetricsService.analyzePlayerRetention();

      expect(result).toEqual(retentionMetrics);
    });
  });

  describe('analyzeSystemLoad', () => {
    it('should analyze system load metrics', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        gte: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [systemMetrics], error: null })
        })
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      const result = await MetricsService.analyzeSystemLoad('hour');

      expect(result).toEqual(expect.objectContaining({
        average_load: expect.any(Number),
        peak_times: expect.any(Array),
        bottlenecks: expect.any(Array),
        recommendations: expect.any(Array)
      }));
    });

    it('should throw error when no metrics available', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        gte: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      await expect(MetricsService.analyzeSystemLoad('hour'))
        .rejects
        .toThrow(TournamentError);
    });
  });

  describe('generateDailyReport', () => {
    it('should generate daily report', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          count: jest.fn().mockResolvedValue({ count: 50, error: null })
        })
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      const result = await MetricsService.generateDailyReport();

      expect(result).toEqual(expect.objectContaining({
        date: expect.any(String),
        metrics: expect.objectContaining({
          total_matches: expect.any(Number),
          active_users: expect.any(Number),
          system_health: expect.any(Object)
        })
      }));
    });
  });

  describe('generateWeeklyReport', () => {
    it('should generate weekly report', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          count: jest.fn().mockResolvedValue({ count: 350, error: null })
        })
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      const result = await MetricsService.generateWeeklyReport();

      expect(result).toEqual(expect.objectContaining({
        date: expect.any(String),
        metrics: expect.any(Object),
        weeklyTrends: expect.any(Object),
        userFeedbackSummary: expect.any(Object)
      }));
    });
  });

  describe('getSystemHealth', () => {
    it('should return system health status', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: systemMetrics, error: null })
          })
        })
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      const result = await MetricsService['getSystemHealth']();

      expect(result).toEqual(expect.objectContaining({
        status: expect.any(String),
        issues: expect.any(Array),
        metrics: expect.any(Object)
      }));
    });
  });

  describe('getHealthStatus', () => {
    it('should return critical status for high error rate', () => {
      const metrics = { ...systemMetrics, error_rate: 15 };
      const status = MetricsService['getHealthStatus'](metrics);
      expect(status).toBe('critical');
    });

    it('should return degraded status for moderate error rate', () => {
      const metrics = { ...systemMetrics, error_rate: 7 };
      const status = MetricsService['getHealthStatus'](metrics);
      expect(status).toBe('degraded');
    });

    it('should return healthy status for normal metrics', () => {
      const status = MetricsService['getHealthStatus'](systemMetrics);
      expect(status).toBe('healthy');
    });
  });

  describe('getHealthIssues', () => {
    it('should identify CPU usage issues', () => {
      const metrics = { ...systemMetrics, cpu_usage: 95 };
      const issues = MetricsService['getHealthIssues'](metrics);
      expect(issues).toContainEqual(expect.objectContaining({
        component: 'CPU',
        status: 'critical'
      }));
    });

    it('should identify error rate issues', () => {
      const metrics = { ...systemMetrics, error_rate: 15 };
      const issues = MetricsService['getHealthIssues'](metrics);
      expect(issues).toContainEqual(expect.objectContaining({
        component: 'Error Rate',
        status: 'critical'
      }));
    });

    it('should return empty array for normal metrics', () => {
      const issues = MetricsService['getHealthIssues'](systemMetrics);
      expect(issues).toEqual([]);
    });
  });
}); 