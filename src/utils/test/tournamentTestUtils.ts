import { render } from '@testing-library/react';
import { TournamentProvider } from '@/contexts/TournamentContext';
import { Tournament, TournamentMatch, Player } from '@/types/tournament';

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <TournamentProvider>
      {ui}
    </TournamentProvider>
  );
}

export function mockSupabaseClient() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          data: [],
          error: null
        }),
        single: () => ({
          data: null,
          error: null
        })
      }),
      insert: () => ({
        select: () => ({
          single: () => ({
            data: null,
            error: null
          })
        })
      }),
      update: () => ({
        eq: () => ({
          data: null,
          error: null
        })
      })
    }),
    channel: () => ({
      on: () => ({
        subscribe: () => ({})
      })
    })
  };
}

export function generateTestData() {
  const tournament: Tournament = {
    id: 'test-tournament',
    title: 'Test Tournament',
    description: 'Tournament for testing',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    entry_fee: 100,
    max_participants: 8,
    status: 'registration',
    rules: {
      min_level: 1,
      required_items: [],
      subject_areas: ['test'],
      time_limit_per_match: 300
    },
    rewards: {
      xp: 1000,
      coins: 500
    },
    created_at: new Date().toISOString()
  };

  const player1: Player = {
    id: 'player1',
    name: 'Test Player 1',
    avatar: 'https://example.com/avatar1.png',
    stats: {
      win_rate: 50,
      matches_played: 10,
      total_score: 1000,
      tournament_wins: 1,
      current_streak: 2
    }
  };

  const player2: Player = {
    id: 'player2',
    name: 'Test Player 2',
    avatar: 'https://example.com/avatar2.png',
    stats: {
      win_rate: 60,
      matches_played: 15,
      total_score: 1500,
      tournament_wins: 2,
      current_streak: 3
    }
  };

  const match: TournamentMatch = {
    id: 'test-match',
    tournament_id: tournament.id,
    round: 1,
    player1,
    player2,
    status: 'ready',
    rules: tournament.rules
  };

  return {
    tournament,
    player1,
    player2,
    match
  };
}

export function generateFeedbackTestData() {
  const matchFeedback = {
    match_id: 'test-match',
    player_id: 'player1',
    rating: 4,
    latency_rating: 5,
    balance_rating: 4,
    comments: 'Great match!',
    issues: ['lag']
  };

  const tournamentFeedback = {
    tournament_id: 'test-tournament',
    player_id: 'player1',
    overall_experience: 5,
    would_play_again: true,
    format_rating: 4,
    suggestions: 'More tournaments like this!'
  };

  return {
    matchFeedback,
    tournamentFeedback
  };
}

export function generateMetricsTestData() {
  const systemMetrics = {
    timestamp: new Date().toISOString(),
    cpu_usage: 65,
    memory_usage: 75,
    error_rate: 2,
    response_time: 500
  };

  const performanceMetrics = {
    average_duration: 240,
    completion_rate: 95,
    error_frequency: {
      'timeout': 2,
      'connection_lost': 1
    }
  };

  const retentionMetrics = {
    daily_active_users: 100,
    weekly_active_users: 500,
    monthly_active_users: 1500,
    churn_rate: 5
  };

  const loadAnalysis = {
    average_load: 70,
    peak_times: [
      new Date().toISOString()
    ],
    bottlenecks: ['High memory usage'],
    recommendations: ['Optimize memory management']
  };

  return {
    systemMetrics,
    performanceMetrics,
    retentionMetrics,
    loadAnalysis
  };
}

export function mockMetricsService() {
  return {
    analyzeMatchDuration: jest.fn().mockResolvedValue({
      average_duration: 240,
      completion_rate: 95,
      error_frequency: {}
    }),
    analyzePlayerRetention: jest.fn().mockResolvedValue({
      daily_active_users: 100,
      weekly_active_users: 500,
      monthly_active_users: 1500,
      churn_rate: 5
    }),
    analyzeSystemLoad: jest.fn().mockResolvedValue({
      average_load: 70,
      peak_times: [],
      bottlenecks: [],
      recommendations: []
    }),
    generateDailyReport: jest.fn().mockResolvedValue({
      date: new Date().toISOString(),
      metrics: {
        total_matches: 50,
        active_users: 100,
        system_health: {
          status: 'healthy',
          issues: []
        }
      }
    }),
    generateWeeklyReport: jest.fn().mockResolvedValue({
      date: new Date().toISOString(),
      metrics: {
        total_matches: 350,
        active_users: 500,
        system_health: {
          status: 'healthy',
          issues: []
        }
      },
      weeklyTrends: {
        user_growth: 10,
        engagement_rate: 65,
        retention_rate: 80,
        satisfaction_score: 4.5
      },
      userFeedbackSummary: {
        average_rating: 4.2,
        total_responses: 150,
        sentiment_analysis: {
          positive: 70,
          neutral: 20,
          negative: 10
        },
        common_feedback: ['Great experience', 'Fun matches']
      }
    })
  };
}

export function mockFeedbackService() {
  return {
    submitMatchFeedback: jest.fn().mockResolvedValue(undefined),
    submitTournamentFeedback: jest.fn().mockResolvedValue(undefined),
    getTournamentFeedbackSummary: jest.fn().mockResolvedValue({
      total_responses: 100,
      average_rating: 4.5,
      would_play_again_rate: 90,
      format_rating: 4.2
    }),
    getMatchFeedbackSummary: jest.fn().mockResolvedValue({
      total_responses: 2,
      average_rating: 4,
      average_latency: 4.5,
      average_balance: 4,
      common_issues: {
        lag: 1
      }
    })
  };
}

export function mockTournamentCache() {
  const cache = new Map();
  
  return {
    getTournament: jest.fn().mockImplementation(id => Promise.resolve(cache.get(`tournament:${id}`))),
    setTournament: jest.fn().mockImplementation((id, data) => {
      cache.set(`tournament:${id}`, data);
      return Promise.resolve();
    }),
    getMatch: jest.fn().mockImplementation(id => Promise.resolve(cache.get(`match:${id}`))),
    setMatch: jest.fn().mockImplementation((id, data) => {
      cache.set(`match:${id}`, data);
      return Promise.resolve();
    }),
    getLeaderboard: jest.fn().mockImplementation(id => Promise.resolve(cache.get(`leaderboard:${id}`))),
    setLeaderboard: jest.fn().mockImplementation((id, data) => {
      cache.set(`leaderboard:${id}`, data);
      return Promise.resolve();
    }),
    invalidateMatch: jest.fn().mockImplementation(id => {
      cache.delete(`match:${id}`);
      return Promise.resolve();
    }),
    invalidateTournament: jest.fn().mockImplementation(id => {
      cache.delete(`tournament:${id}`);
      cache.delete(`leaderboard:${id}`);
      return Promise.resolve();
    }),
    clearAll: jest.fn().mockImplementation(() => {
      cache.clear();
      return Promise.resolve();
    })
  };
} 