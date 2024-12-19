import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeedbackModal } from '../FeedbackModal';
import { FeedbackService } from '@/services/feedbackService';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

jest.mock('@/services/feedbackService');
jest.mock('@/hooks/useAuth');
jest.mock('react-hot-toast');

describe('FeedbackModal', () => {
  const mockUser = { id: 'user1' };
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
  });

  describe('Match Feedback', () => {
    const props = {
      isOpen: true,
      onClose: mockOnClose,
      type: 'match' as const,
      id: 'match1'
    };

    it('renders match feedback form', () => {
      render(<FeedbackModal {...props} />);

      expect(screen.getByText('Match Feedback')).toBeInTheDocument();
      expect(screen.getByText('Overall Rating')).toBeInTheDocument();
      expect(screen.getByText('Connection Quality')).toBeInTheDocument();
      expect(screen.getByText('Match Balance')).toBeInTheDocument();
      expect(screen.getByText('Issues Encountered')).toBeInTheDocument();
    });

    it('submits match feedback successfully', async () => {
      render(<FeedbackModal {...props} />);

      // Set ratings
      fireEvent.change(screen.getByLabelText('Overall Rating'), { target: { value: '4' } });
      fireEvent.change(screen.getByLabelText('Connection Quality'), { target: { value: '5' } });
      fireEvent.change(screen.getByLabelText('Match Balance'), { target: { value: '4' } });

      // Check issues
      fireEvent.click(screen.getByLabelText('Lag'));
      
      // Add comments
      fireEvent.change(screen.getByPlaceholderText('Share your thoughts...'), {
        target: { value: 'Great match!' }
      });

      // Submit form
      fireEvent.click(screen.getByText('Submit Feedback'));

      await waitFor(() => {
        expect(FeedbackService.submitMatchFeedback).toHaveBeenCalledWith({
          match_id: 'match1',
          player_id: 'user1',
          rating: 4,
          latency_rating: 5,
          balance_rating: 4,
          comments: 'Great match!',
          issues: ['lag']
        });
        expect(toast.success).toHaveBeenCalledWith('Thank you for your feedback!');
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('handles submission error', async () => {
      (FeedbackService.submitMatchFeedback as jest.Mock).mockRejectedValue(new Error());
      
      render(<FeedbackModal {...props} />);
      
      fireEvent.click(screen.getByText('Submit Feedback'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to submit feedback');
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });
  });

  describe('Tournament Feedback', () => {
    const props = {
      isOpen: true,
      onClose: mockOnClose,
      type: 'tournament' as const,
      id: 'tournament1'
    };

    it('renders tournament feedback form', () => {
      render(<FeedbackModal {...props} />);

      expect(screen.getByText('Tournament Feedback')).toBeInTheDocument();
      expect(screen.getByText('Overall Rating')).toBeInTheDocument();
      expect(screen.queryByText('Connection Quality')).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText('Share your thoughts...')).toBeInTheDocument();
    });

    it('submits tournament feedback successfully', async () => {
      render(<FeedbackModal {...props} />);

      // Set ratings
      fireEvent.change(screen.getByLabelText('Overall Rating'), { target: { value: '5' } });
      
      // Add suggestions
      fireEvent.change(screen.getByPlaceholderText('Share your thoughts...'), {
        target: { value: 'Great tournament format!' }
      });

      // Submit form
      fireEvent.click(screen.getByText('Submit Feedback'));

      await waitFor(() => {
        expect(FeedbackService.submitTournamentFeedback).toHaveBeenCalledWith({
          tournament_id: 'tournament1',
          player_id: 'user1',
          overall_experience: 5,
          would_play_again: true,
          format_rating: 5,
          suggestions: 'Great tournament format!'
        });
        expect(toast.success).toHaveBeenCalledWith('Thank you for your feedback!');
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('handles submission error', async () => {
      (FeedbackService.submitTournamentFeedback as jest.Mock).mockRejectedValue(new Error());
      
      render(<FeedbackModal {...props} />);
      
      fireEvent.click(screen.getByText('Submit Feedback'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to submit feedback');
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });
  });

  it('closes modal when cancel is clicked', () => {
    render(
      <FeedbackModal
        isOpen={true}
        onClose={mockOnClose}
        type="match"
        id="match1"
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not submit when user is not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });

    render(
      <FeedbackModal
        isOpen={true}
        onClose={mockOnClose}
        type="match"
        id="match1"
      />
    );

    fireEvent.click(screen.getByText('Submit Feedback'));

    await waitFor(() => {
      expect(FeedbackService.submitMatchFeedback).not.toHaveBeenCalled();
      expect(FeedbackService.submitTournamentFeedback).not.toHaveBeenCalled();
    });
  });
}); 