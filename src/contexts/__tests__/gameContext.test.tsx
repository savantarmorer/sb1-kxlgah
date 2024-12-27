import React from 'react';
import { screen, fireEvent, render } from '@testing-library/react';
import { useGame } from '../GameContext';
import { vi } from 'vitest';
import type { GameState } from '../../types/game';
import { Quest, QuestType, QuestStatus } from '../../types/quests';
import type { Achievement } from '../../types/achievements';
import type { User } from '../../types/user';
import { initialGameState } from '../game/initialState';
import { renderWithProviders } from '../../test/testUtils';

// Mock quest and achievement data
const mockQuest: Quest = {
  id: 'quest1',
  title: 'Test Quest',
  description: 'Test Description',
  type: QuestType.BATTLE,
  category: 'battle',
  xp_reward: 100,
  coin_reward: 50,
  requirements: [{
    type: QuestType.BATTLE,
    amount: 1,
    target: 1,
    current: 0,
    description: 'Win a battle'
  }],
  is_active: true,
  status: QuestStatus.IN_PROGRESS,
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

// Mock user data
const mockUser: User = {
  id: 'test-user',
  name: 'Test User',
  email: 'test@example.com',
  level: 1,
  xp: 0,
  coins: 0,
  streak: 0,
  battle_rating: 1000
};

// Test component that uses the game context
const TestComponent = () => {
  const { state, dispatch } = useGame();
  return (
    <div>
      <div data-testid="game-state">{JSON.stringify(state)}</div>
      <button data-testid="init-user" onClick={() => dispatch({ type: 'INITIALIZE_USER', payload: mockUser })}>Initialize User</button>
      <button data-testid="add-xp" onClick={() => dispatch({ type: 'ADD_XP', payload: { amount: 100, source: 'test' } })}>Add XP</button>
      <button data-testid="add-coins" onClick={() => dispatch({ type: 'ADD_COINS', payload: { amount: 50, source: 'test' } })}>Add Coins</button>
      <button data-testid="complete-quest" onClick={() => dispatch({ type: 'UPDATE_QUESTS', payload: { active: [], completed: [mockQuest] } })}>Complete Quest</button>
      <button data-testid="unlock-achievement" onClick={() => dispatch({ type: 'UNLOCK_ACHIEVEMENTS', payload: [mockAchievement] })}>Unlock Achievement</button>
      <button data-testid="update-user" onClick={() => dispatch({ type: 'UPDATE_USER_PROFILE', payload: { name: 'Test User', level: 2, xp: 1500, coins: 1000 } })}>Update User</button>
    </div>
  );
};

describe('GameContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial game state', () => {
    const { getByTestId } = renderWithProviders(<TestComponent />, { initialGameState });

    const gameState = JSON.parse(getByTestId('game-state').textContent || '{}');
    expect(gameState).toMatchObject(initialGameState);
  });

  it('should handle XP gain and level up', () => {
    const { getByTestId } = renderWithProviders(<TestComponent />, { 
      initialGameState: {
        ...initialGameState,
        user: mockUser
      }
    });

    // Add XP
    const addXpButton = getByTestId('add-xp');
    fireEvent.click(addXpButton);

    const gameState = JSON.parse(getByTestId('game-state').textContent || '{}');
    expect(gameState.user?.xp).toBe(100);
  });

  it('should handle coin transactions', () => {
    const { getByTestId } = renderWithProviders(<TestComponent />, { 
      initialGameState: {
        ...initialGameState,
        user: mockUser
      }
    });

    // Add coins
    const addCoinsButton = getByTestId('add-coins');
    fireEvent.click(addCoinsButton);

    const gameState = JSON.parse(getByTestId('game-state').textContent || '{}');
    expect(gameState.user?.coins).toBe(50);
  });

  it('should handle quest completion', () => {
    const { getByTestId } = renderWithProviders(<TestComponent />, { 
      initialGameState: {
        ...initialGameState,
        user: mockUser
      }
    });

    // Complete quest
    const completeQuestButton = getByTestId('complete-quest');
    fireEvent.click(completeQuestButton);

    const gameState = JSON.parse(getByTestId('game-state').textContent || '{}');
    expect(gameState.quests.completed).toContainEqual(expect.objectContaining({
      id: mockQuest.id,
      status: QuestStatus.IN_PROGRESS
    }));
  });

  it('should handle achievement unlocks', () => {
    const { getByTestId } = renderWithProviders(<TestComponent />, { 
      initialGameState: {
        ...initialGameState,
        user: mockUser
      }
    });

    // Unlock achievement
    const unlockAchievementButton = getByTestId('unlock-achievement');
    fireEvent.click(unlockAchievementButton);

    const gameState = JSON.parse(getByTestId('game-state').textContent || '{}');
    expect(gameState.achievements).toContainEqual(expect.objectContaining({
      id: mockAchievement.id,
      title: mockAchievement.title,
      unlocked: true
    }));
  });

  it('should handle user profile updates', () => {
    const { getByTestId } = renderWithProviders(<TestComponent />, { 
      initialGameState: {
        ...initialGameState,
        user: mockUser
      }
    });

    // Update profile
    const updateUserButton = getByTestId('update-user');
    fireEvent.click(updateUserButton);

    const gameState = JSON.parse(getByTestId('game-state').textContent || '{}');
    expect(gameState.user).toMatchObject({
      name: 'Test User',
      level: 2,
      xp: 1500,
      coins: 1000,
    });
  });
}); 