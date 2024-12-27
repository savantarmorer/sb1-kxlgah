import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameProvider, useGame } from '../GameContext';
import { vi } from 'vitest';
import type { GameState } from '../../types/game';
import type { Quest } from '../../types/quests';
import type { Achievement } from '../../types/achievements';

// Mock quest and achievement data
const mockQuest: Quest = {
  id: 'quest1',
  title: 'Test Quest',
  description: 'Test Description',
  type: 'battle',
  category: 'battle',
  xp_reward: 100,
  coin_reward: 50,
  requirements: [{
    type: 'battle',
    amount: 1,
    target: 1,
    current: 0,
    description: 'Win a battle'
  }],
  is_active: true,
  status: 'in_progress',
  progress: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  required_level: 1,
  rewards: [{
    type: 'xp',
    value: 100
  }, {
    type: 'coins',
    value: 50
  }]
};

const mockAchievement: Achievement = {
  id: 'achievement1',
  title: 'Test Achievement',
  description: 'Test Description',
  category: 'battle',
  points: 100,
  rarity: 'common',
  unlocked: true,
  unlocked_at: new Date().toISOString(),
  order_num: 1,
  metadata: {
    icon: 'test-icon'
  },
  trigger_conditions: [{
    type: 'battle_wins',
    value: 1,
    comparison: 'gte',
    current: 1
  }],
  prerequisites: [],
  dependents: []
};

// Mock initial state
const mockInitialState: GameState = {
  user: {
    id: 'test-user',
    name: 'Test User',
    level: 1,
    xp: 0,
    coins: 0,
  },
  battleStats: {
    wins: 0,
    losses: 0,
    draws: 0,
    total_games: 0
  },
  battleRatings: {
    rating: 1000,
    rank: 'Bronze',
    tier: 'III'
  },
  settings: {
    sound_enabled: true,
    music_enabled: true,
    notifications_enabled: true,
    theme: 'light'
  },
  loading: false,
  error: null
};

// Test component that uses the game context
const TestComponent = () => {
  const { state, dispatch } = useGame();
  return (
    <div>
      <div data-testid="game-state">{JSON.stringify(state)}</div>
      <button onClick={() => dispatch({ type: 'ADD_XP', payload: { amount: 100, source: 'test' } })}>Add XP</button>
      <button onClick={() => dispatch({ type: 'ADD_COINS', payload: { amount: 50, source: 'test' } })}>Add Coins</button>
      <button onClick={() => dispatch({ type: 'UPDATE_QUESTS', payload: { active: [], completed: [mockQuest] } })}>Complete Quest</button>
      <button onClick={() => dispatch({ type: 'UNLOCK_ACHIEVEMENTS', payload: [mockAchievement] })}>Unlock Achievement</button>
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
      user: {
        id: expect.any(String),
        name: expect.any(String),
        level: expect.any(Number),
        xp: 0,
        coins: 0,
      },
      battleStats: {
        wins: 0,
        losses: 0,
        draws: 0,
        total_games: 0
      },
      settings: {
        sound_enabled: true,
        music_enabled: true,
        notifications_enabled: true,
        theme: expect.any(String)
      }
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
    expect(gameState.quests.completed).toContainEqual(expect.objectContaining({
      id: mockQuest.id,
      status: 'completed'
    }));
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
      id: mockAchievement.id,
      title: mockAchievement.title,
      unlocked: true
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