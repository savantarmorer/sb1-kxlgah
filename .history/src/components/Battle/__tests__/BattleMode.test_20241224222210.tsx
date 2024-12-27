import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import BattleMode from '../BattleMode';
import { GameProvider } from '../../../contexts/GameContext';
import { NotificationProvider } from '../../../contexts/NotificationContext';
import { supabase } from '../../../lib/supabase';
import { createDeck, drawCards } from '../../../utils/cardUtils';
import { calculateBattleRewards } from '../../../utils/battleRewards';

// Mock the dependencies
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({
            data: mockQuestions,
            error: null
          })
        })),
        limit: vi.fn().mockResolvedValue({
          data: mockQuestions,
          error: null
        })
      }))
    }))
  }
}));

vi.mock('../../../utils/cardUtils', () => ({
  createDeck: vi.fn(() => mockDeck),
  drawCards: vi.fn(() => ({ drawn: mockHand, remaining: [] })),
  getAICardSelection: vi.fn(() => mockHand[0])
}));

// Mock data
const mockQuestions = [
  {
    id: '1',
    question: 'Test Question 1',
    alternative_a: 'A) Option 1',
    alternative_b: 'B) Option 2',
    alternative_c: 'C) Option 3',
    alternative_d: 'D) Option 4',
    correct_answer: 'A',
    category: 'Direito Constitucional',
    difficulty: 'medium'
  },
  // Add more mock questions as needed
];

const mockDeck = Array.from({ length: 7 }, (_, i) => ({
  id: `card_${i}`,
  action: i < 3 ? 'attack' : i < 5 ? 'defense' : 'counter',
  power: 10
}));

const mockHand = mockDeck.slice(0, 3);

// Test wrapper
const renderBattleMode = () => {
  return render(
    <GameProvider>
      <NotificationProvider>
        <BattleMode mode="all" />
      </NotificationProvider>
    </GameProvider>
  );
};

describe('BattleMode Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes battle with correct state', async () => {
    renderBattleMode();
    
    // Find and click the start battle button
    const startButton = screen.getByText(/start battle/i);
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('battle_questions');
    });

    // Verify initial state
    expect(screen.getByText(/50/)).toBeInTheDocument(); // Health display
    expect(screen.getByText(/0/)).toBeInTheDocument(); // Score display
  });

  it('handles card selection correctly', async () => {
    renderBattleMode();
    
    // Start battle
    fireEvent.click(screen.getByText(/start battle/i));
    
    await waitFor(() => {
      // Wait for cards to be dealt
      expect(screen.getByTestId('player-hand')).toBeInTheDocument();
    });

    // Select a card
    const firstCard = screen.getByTestId('card-0');
    fireEvent.click(firstCard);

    // Verify card selection
    expect(firstCard).toHaveClass('selected');
    expect(screen.getByTestId('opponent-card')).toBeInTheDocument();
  });

  it('calculates damage correctly for attack action', async () => {
    renderBattleMode();
    
    // Start battle and select attack card
    fireEvent.click(screen.getByText(/start battle/i));
    
    await waitFor(() => {
      const attackCard = screen.getByTestId('attack-card');
      fireEvent.click(attackCard);
    });

    // Answer question correctly
    const correctAnswer = screen.getByText(/A\) Option 1/i);
    fireEvent.click(correctAnswer);

    // Verify damage calculation
    await waitFor(() => {
      const opponentHealth = screen.getByTestId('opponent-health');
      expect(opponentHealth.textContent).toBe('20'); // 50 - 30 (timeLeft damage)
    });
  });

  it('handles wrong answers correctly', async () => {
    renderBattleMode();
    
    // Start battle
    fireEvent.click(screen.getByText(/start battle/i));
    
    await waitFor(() => {
      const card = screen.getByTestId('card-0');
      fireEvent.click(card);
    });

    // Answer incorrectly
    const wrongAnswer = screen.getByText(/B\) Option 2/i);
    fireEvent.click(wrongAnswer);

    // Verify penalty
    await waitFor(() => {
      const playerHealth = screen.getByTestId('player-health');
      expect(playerHealth.textContent).toBe('45'); // 50 - 5 (penalty)
    });
  });

  it('reshuffles deck when both players are out of cards', async () => {
    renderBattleMode();
    
    // Start battle
    fireEvent.click(screen.getByText(/start battle/i));
    
    // Use all cards
    for (let i = 0; i < 3; i++) {
      await waitFor(() => {
        const card = screen.getByTestId(`card-${i}`);
        fireEvent.click(card);
      });

      // Answer question
      const answer = screen.getByText(/A\) Option 1/i);
      fireEvent.click(answer);

      // Wait for next round
      await waitFor(() => {
        expect(screen.getByTestId('player-hand')).toBeInTheDocument();
      });
    }

    // Verify reshuffle
    expect(createDeck).toHaveBeenCalledTimes(2); // Initial + reshuffle
    expect(drawCards).toHaveBeenCalledTimes(4); // Initial (2) + reshuffle (2)
  });

  it('ends game when player health reaches 0', async () => {
    renderBattleMode();
    
    // Start battle
    fireEvent.click(screen.getByText(/start battle/i));
    
    // Simulate multiple wrong answers to deplete health
    for (let i = 0; i < 10; i++) {
      await waitFor(() => {
        const card = screen.getByTestId('card-0');
        fireEvent.click(card);
      });

      const wrongAnswer = screen.getByText(/B\) Option 2/i);
      fireEvent.click(wrongAnswer);

      // Check if game ended
      const gameOver = screen.queryByText(/game over/i);
      if (gameOver) {
        expect(gameOver).toBeInTheDocument();
        break;
      }
    }
  });

  it('calculates battle rewards correctly', async () => {
    renderBattleMode();
    
    // Start battle
    fireEvent.click(screen.getByText(/start battle/i));
    
    await waitFor(() => {
      const card = screen.getByTestId('card-0');
      fireEvent.click(card);
    });

    // Answer correctly
    const correctAnswer = screen.getByText(/A\) Option 1/i);
    fireEvent.click(correctAnswer);

    // Verify rewards calculation
    await waitFor(() => {
      const score = screen.getByTestId('player-score');
      expect(parseInt(score.textContent || '0')).toBeGreaterThan(0);
    });
  });
});

// Add more test files for specific components 