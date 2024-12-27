import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeedbackButton } from '../FeedbackButton';

describe('FeedbackButton', () => {
  const defaultProps = {
    type: 'match' as const,
    id: 'match1'
  };

  it('renders feedback button with default variant', () => {
    render(<FeedbackButton {...defaultProps} />);
    
    const button = screen.getByText('Give Feedback');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('primary');
  });

  it('renders feedback button with negative variant', () => {
    render(<FeedbackButton {...defaultProps} variant="negative" />);
    
    const button = screen.getByText('Give Feedback');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('danger');
  });

  it('opens feedback modal when clicked', () => {
    render(<FeedbackButton {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Give Feedback'));
    
    expect(screen.getByText('Match Feedback')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<FeedbackButton {...defaultProps} className="custom-class" />);
    
    const button = screen.getByText('Give Feedback');
    expect(button).toHaveClass('custom-class');
  });

  it('renders tournament feedback modal for tournament type', () => {
    render(
      <FeedbackButton
        type="tournament"
        id="tournament1"
      />
    );
    
    fireEvent.click(screen.getByText('Give Feedback'));
    
    expect(screen.getByText('Tournament Feedback')).toBeInTheDocument();
  });

  it('closes modal when cancel is clicked', () => {
    render(<FeedbackButton {...defaultProps} />);
    
    // Open modal
    fireEvent.click(screen.getByText('Give Feedback'));
    expect(screen.getByText('Match Feedback')).toBeInTheDocument();
    
    // Close modal
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Match Feedback')).not.toBeInTheDocument();
  });
}); 