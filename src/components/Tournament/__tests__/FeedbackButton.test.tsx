import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../test/testUtils';
import { FeedbackButton } from '../FeedbackButton';
import { vi } from 'vitest';

// Mock @headlessui/react
vi.mock('@headlessui/react', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog">{children}</div>,
  Transition: {
    Child: ({ children }: { children: React.ReactNode }) => children,
  },
}));

describe('FeedbackButton', () => {
  it('should render correctly', () => {
    renderWithProviders(<FeedbackButton />);
    expect(screen.getByRole('button', { name: /feedback/i })).toBeInTheDocument();
  });

  it('should open modal on click', () => {
    renderWithProviders(<FeedbackButton />);
    
    const button = screen.getByRole('button', { name: /feedback/i });
    fireEvent.click(button);

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('should close modal when feedback is submitted', async () => {
    renderWithProviders(<FeedbackButton />);
    
    // Open modal
    const button = screen.getByRole('button', { name: /feedback/i });
    fireEvent.click(button);

    // Submit feedback
    const input = screen.getByPlaceholderText(/your feedback/i);
    fireEvent.change(input, { target: { value: 'Test feedback' } });
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    // Wait for modal to close
    await screen.findByText(/thank you/i);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });
}); 