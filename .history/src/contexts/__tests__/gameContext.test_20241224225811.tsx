import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameProvider, useGame } from '../GameContext';
import { vi } from 'vitest';

// Mock initial state
const mockInitialState = {
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
};

// Test component that uses the game context
const TestComponent = () => {
  const { state, dispatch } = useGame();
  return (
    <div>
      <div data-testid="game-state">{JSON.stringify(state)}</div>
      <button onClick={() => dispatch({ type: 'ADD_XP', payload: 100 })}>Add XP</button>
      <button onClick={() => dispatch({ type: 'ADD_COINS', payload: 50 })}>Add Coins</button>
      <button onClick={() => dispatch({ type: 'COMPLETE_QUEST', payload: { id: 'quest1', rewards: { xp: 100, coins: 50 } } })}>Complete Quest</button>
      <button onClick={() => dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: { id: 'achievement1', rewards: { xp: 200, coins: 100 } } })}>Unlock Achievement</button>
      <button onClick={() => dispatch({ type: 'UPDATE_USER', payload: { name: 'Test User', level: 2, xp: 1500, coins: 1000 } })}>Update User</button>
    </div>
  );
};

describe('GameContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial game state', () => {
    render(
      <GameProvider initialState={mockInitialState}>
        <TestComponent />
      </GameProvider>
    );

    const gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    expect(gameState).toMatchObject({
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
    });
  });

  it('should handle XP gain and level up', () => {
    render(
      <GameProvider initialState={mockInitialState}>
        <TestComponent />
      </GameProvider>
    );

    const addXpButton = screen.getByText('Add XP');
    fireEvent.click(addXpButton);

    const gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    expect(gameState.user.xp).toBe(100);
  });

  it('should handle coin transactions', () => {
    render(
      <GameProvider initialState={mockInitialState}>
        <TestComponent />
      </GameProvider>
    );

    const addCoinsButton = screen.getByText('Add Coins');
    fireEvent.click(addCoinsButton);

    const gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    expect(gameState.user.coins).toBe(50);
  });

  it('should handle quest completion', () => {
    render(
      <GameProvider initialState={mockInitialState}>
        <TestComponent />
      </GameProvider>
    );

    const completeQuestButton = screen.getByText('Complete Quest');
    fireEvent.click(completeQuestButton);

    const gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    expect(gameState.quests.completed).toContain('quest1');
    expect(gameState.user.xp).toBe(100);
    expect(gameState.user.coins).toBe(50);
  });

  it('should handle achievement unlocks', () => {
    render(
      <GameProvider initialState={mockInitialState}>
        <TestComponent />
      </GameProvider>
    );

    const unlockAchievementButton = screen.getByText('Unlock Achievement');
    fireEvent.click(unlockAchievementButton);

    const gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    expect(gameState.achievements).toContain('achievement1');
    expect(gameState.user.xp).toBe(200);
    expect(gameState.user.coins).toBe(100);
  });

  it('should handle user profile updates', () => {
    render(
      <GameProvider initialState={mockInitialState}>
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