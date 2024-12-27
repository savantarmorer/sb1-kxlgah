import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../test/testUtils';
import { FeedbackModal } from '../FeedbackModal';
import { vi } from 'vitest';

// Mock @headlessui/react
vi.mock('@headlessui/react', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog">{children}</div>,
  Transition: {
    Child: ({ children }: { children: React.ReactNode }) => children,
  },
}));

describe('FeedbackModal', () => {
  it('should render correctly when open', () => {
    renderWithProviders(
      <FeedbackModal isOpen={true} onClose={() => {}} />
    );

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your feedback/i)).toBeInTheDocument();
  });

  it('should handle feedback submission', async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <FeedbackModal isOpen={true} onClose={onClose} />
    );

    const input = screen.getByPlaceholderText(/your feedback/i);
    fireEvent.change(input, { target: { value: 'Test feedback' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    // Wait for submission and close
    await screen.findByText(/thank you/i);
    expect(onClose).toHaveBeenCalled();
  });
}); 