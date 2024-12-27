import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockUser } from '../../../test/testUtils';
import { FeedbackModal } from '../FeedbackModal';
import { vi } from 'vitest';

vi.mock('@/services/feedbackService', () => ({
  FeedbackService: {
    submitFeedback: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('FeedbackModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    renderWithProviders(
      <FeedbackModal isOpen={true} onClose={mockOnClose} tournamentId="test-id" />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/feedback/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('handles feedback submission', async () => {
    renderWithProviders(
      <FeedbackModal isOpen={true} onClose={mockOnClose} tournamentId="test-id" />
    );

    const input = screen.getByLabelText(/feedback/i);
    fireEvent.change(input, { target: { value: 'Great tournament!' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('displays error message on submission failure', async () => {
    vi.mocked(FeedbackService.submitFeedback).mockRejectedValueOnce(new Error('Failed to submit'));

    renderWithProviders(
      <FeedbackModal isOpen={true} onClose={mockOnClose} tournamentId="test-id" />
    );

    const input = screen.getByLabelText(/feedback/i);
    fireEvent.change(input, { target: { value: 'Test feedback' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error submitting feedback/i)).toBeInTheDocument();
    });
  });
}); 