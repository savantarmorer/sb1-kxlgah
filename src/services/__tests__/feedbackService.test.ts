import { FeedbackService } from '../feedbackService';
import { generateFeedbackTestData } from '@/utils/test/tournamentTestUtils';
import { supabase } from '@/lib/supabase';
import { TournamentError } from '@/errors/TournamentError';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

describe('FeedbackService', () => {
  const { matchFeedback, tournamentFeedback } = generateFeedbackTestData();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitMatchFeedback', () => {
    it('should submit match feedback successfully', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert
      });

      await FeedbackService.submitMatchFeedback(matchFeedback);

      expect(supabase.from).toHaveBeenCalledWith('match_feedback');
      expect(mockInsert).toHaveBeenCalledWith(matchFeedback);
    });

    it('should throw error when submission fails', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: new Error('Failed') });
      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert
      });

      await expect(FeedbackService.submitMatchFeedback(matchFeedback))
        .rejects
        .toThrow(TournamentError);
    });
  });

  describe('submitTournamentFeedback', () => {
    it('should submit tournament feedback successfully', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert
      });

      await FeedbackService.submitTournamentFeedback(tournamentFeedback);

      expect(supabase.from).toHaveBeenCalledWith('tournament_feedback');
      expect(mockInsert).toHaveBeenCalledWith(tournamentFeedback);
    });

    it('should throw error when submission fails', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: new Error('Failed') });
      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert
      });

      await expect(FeedbackService.submitTournamentFeedback(tournamentFeedback))
        .rejects
        .toThrow(TournamentError);
    });
  });

  describe('getTournamentFeedbackSummary', () => {
    it('should return tournament feedback summary', async () => {
      const mockData = [
        { overall_experience: 5, would_play_again: true, format_rating: 4 },
        { overall_experience: 4, would_play_again: true, format_rating: 5 }
      ];

      const mockSelect = jest.fn().mockResolvedValue({ data: mockData, error: null });
      const mockEq = jest.fn().mockReturnValue({ data: mockData, error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq
      });

      const summary = await FeedbackService.getTournamentFeedbackSummary('test-tournament');

      expect(summary).toEqual({
        total_responses: 2,
        average_rating: 4.5,
        would_play_again_rate: 100,
        format_rating: 4.5
      });
    });

    it('should return null when no feedback exists', async () => {
      const mockSelect = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockEq = jest.fn().mockReturnValue({ data: [], error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq
      });

      const summary = await FeedbackService.getTournamentFeedbackSummary('test-tournament');

      expect(summary).toBeNull();
    });
  });

  describe('getMatchFeedbackSummary', () => {
    it('should return match feedback summary', async () => {
      const mockData = [
        { rating: 4, latency_rating: 5, balance_rating: 4, issues: ['lag'] },
        { rating: 5, latency_rating: 4, balance_rating: 5, issues: ['lag', 'disconnect'] }
      ];

      const mockSelect = jest.fn().mockResolvedValue({ data: mockData, error: null });
      const mockEq = jest.fn().mockReturnValue({ data: mockData, error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq
      });

      const summary = await FeedbackService.getMatchFeedbackSummary('test-match');

      expect(summary).toEqual({
        total_responses: 2,
        average_rating: 4.5,
        average_latency: 4.5,
        average_balance: 4.5,
        common_issues: {
          lag: 2,
          disconnect: 1
        }
      });
    });

    it('should return null when no feedback exists', async () => {
      const mockSelect = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockEq = jest.fn().mockReturnValue({ data: [], error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq
      });

      const summary = await FeedbackService.getMatchFeedbackSummary('test-match');

      expect(summary).toBeNull();
    });
  });
}); 