import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameProvider, useGame } from '../GameContext';
import { vi } from 'vitest';
import { GameState } from '../types';

// Mock initial state
const mockInitialState: GameState = {
  loading: false,
  syncing: false,
  user: {
    id: 'test-user',
    name: 'Test User',
    level: 1,
    xp: 0,
    coins: 0,
  },
  quests: {
    active: [],
    completed: [],
  },
  achievements: [],
  items: [],
  battle: null,
  debugMode: false,
  stats: {
    battles_won: 0,
    battles_lost: 0,
    total_xp: 0,
    total_coins: 0,
  }
};

// Test component that uses the game context
const TestComponent = () => {
  const { state, dispatch } = useGame();
  return (
    <div>
      <div data-testid="game-state">{JSON.stringify(state)}</div>
      <button onClick={() => dispatch({ type: 'ADD_XP', payload: { amount: 100, source: 'test' } })}>Add XP</button>
      <button onClick={() => dispatch({ type: 'ADD_COINS', payload: { amount: 50, source: 'test' } })}>Add Coins</button>
      <button onClick={() => dispatch({ type: 'UPDATE_QUESTS', payload: { active: [], completed: ['quest1'] } })}>Complete Quest</button>
      <button onClick={() => dispatch({ type: 'UNLOCK_ACHIEVEMENTS', payload: [{ id: 'achievement1', title: 'Test Achievement', description: 'Test Description', unlocked_at: new Date().toISOString() }] })}>Unlock Achievement</button>
      <button onClick={() => dispatch({ type: 'UPDATE_USER_PROFILE', payload: { name: 'Test User', level: 2, xp: 1500, coins: 1000 } })}>Update User</button>
    </div>
  );
};

describe('GameContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial game state', () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    const gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    expect(gameState).toMatchObject({
      loading: false,
      syncing: false,
      user: {
        id: expect.any(String),
        name: expect.any(String),
        level: expect.any(Number),
        xp: 0,
        coins: 0,
      },
      quests: {
        active: [],
        completed: [],
      },
      achievements: [],
      items: [],
    });
  });

  it('should handle XP gain and level up', () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    const addXpButton = screen.getByText('Add XP');
    fireEvent.click(addXpButton);

    const gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    expect(gameState.user.xp).toBe(100);
    expect(gameState.stats.total_xp).toBe(100);
  });

  it('should handle coin transactions', () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    const addCoinsButton = screen.getByText('Add Coins');
    fireEvent.click(addCoinsButton);

    const gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    expect(gameState.user.coins).toBe(50);
    expect(gameState.stats.total_coins).toBe(50);
  });

  it('should handle quest completion', () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    const completeQuestButton = screen.getByText('Complete Quest');
    fireEvent.click(completeQuestButton);

    const gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    expect(gameState.quests.completed).toContain('quest1');
  });

  it('should handle achievement unlocks', () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    const unlockAchievementButton = screen.getByText('Unlock Achievement');
    fireEvent.click(unlockAchievementButton);

    const gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    expect(gameState.achievements).toContainEqual(expect.objectContaining({
      id: 'achievement1',
      title: 'Test Achievement'
    }));
  });

  it('should handle user profile updates', () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    const updateUserButton = screen.getByText('Update User');
    fireEvent.click(updateUserButton);

    const gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    expect(gameState.user).toMatchObject({
      name: 'Test User',
      level: 2,
      xp: 1500,
      coins: 1000,
    });
  });
}); 