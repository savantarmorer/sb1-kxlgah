import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { GameProvider, useGame } from '../GameContext';
import { LEVEL_CONFIG } from '../../lib/gameConfig';
import type { Achievement, AchievementRarity } from '../../types/achievements';
import type { Reward } from '../../types/rewards';
import { supabase } from '../../lib/supabaseClient.ts';

// Set up environment variables for testing
process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock Supabase
jest.mock('../../lib/supabaseClient');

// Mock AuthContext
jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user']
    }
  })
}));

// Test component to access context
const TestComponent: React.FC = () => {
  const { state, dispatch } = useGame();
  return (
    <div>
      <div data-testid="game-state">{JSON.stringify(state)}</div>
      <button 
        data-testid="add-xp"
        onClick={() => dispatch({ 
          type: 'ADD_XP', 
          payload: { amount: 100, source: 'test' } 
        })}
      >
        Add XP
      </button>
      <button 
        data-testid="add-coins"
        onClick={() => dispatch({ 
          type: 'ADD_COINS', 
          payload: { amount: 50, source: 'test' } 
        })}
      >
        Add Coins
      </button>
      <button
        data-testid="complete-quest"
        onClick={() => {
          const rewards: Reward[] = [
            {
              id: 'xp-reward',
              type: 'xp',
              value: 100,
              name: 'XP Reward',
              description: 'XP for completing quest',
              amount: 100
            },
            {
              id: 'coin-reward',
              type: 'coins',
              value: 50,
              name: 'Coin Reward',
              description: 'Coins for completing quest',
              amount: 50
            }
          ];
          dispatch({
            type: 'COMPLETE_QUEST',
            payload: {
              quest_id: 'test-quest',
              rewards
            }
          });
        }}
      >
        Complete Quest
      </button>
      <button
        data-testid="unlock-achievement"
        onClick={() => {
          const achievement: Achievement = {
            id: 'test-achievement',
            title: 'Test Achievement',
            description: 'Achievement for testing',
            category: 'test',
            points: 100,
            rarity: 'common' as AchievementRarity,
            unlocked: true,
            prerequisites: [],
            dependents: [],
            trigger_conditions: [
              {
                type: 'xp_gained',
                value: 100,
                comparison: 'gte'
              }
            ],
            order_num: 1,
            progress: 100,
            icon: '🏆'
          };
          dispatch({
            type: 'UNLOCK_ACHIEVEMENT',
            payload: achievement
          });
        }}
      >
        Unlock Achievement
      </button>
      <button
        data-testid="update-user"
        onClick={() => dispatch({
          type: 'UPDATE_USER_PROFILE',
          payload: {
            name: 'Test User',
            level: 2,
            xp: 1500,
            coins: 1000
          }
        })}
      >
        Update User
      </button>
    </div>
  );
};

describe('GameContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      debugMode: false,
      completedQuests: [],
      items: [],
      quests: {
        active: [],
        completed: []
      },
      achievements: []
    });
  });

  it('should handle XP gain and level up', () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    const addXpButton = screen.getByTestId('add-xp');
    
    // Initial state
    let gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    const initialLevel = gameState.user?.level || 1;
    const initialXp = gameState.user?.xp || 0;

    // Add XP
    fireEvent.click(addXpButton);
    
    // Check updated state
    gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    expect(gameState.user.xp).toBe(initialXp + 100);
    
    // Add enough XP to level up
    const xpForNextLevel = LEVEL_CONFIG.base_xp * Math.pow(LEVEL_CONFIG.scalingFactor, initialLevel);
    const remainingXp = xpForNextLevel - initialXp;
    
    act(() => {
      for (let i = 0; i < Math.ceil(remainingXp / 100); i++) {
        fireEvent.click(addXpButton);
      }
    });

    // Verify level up
    gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    expect(gameState.user.level).toBe(initialLevel + 1);
  });

  it('should handle coin transactions', () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    const addCoinsButton = screen.getByTestId('add-coins');
    
    // Initial state
    let gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    const initialCoins = gameState.user?.coins || 0;

    // Add coins
    fireEvent.click(addCoinsButton);
    
    // Check updated state
    gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    expect(gameState.user.coins).toBe(initialCoins + 50);
  });

  it('should handle quest completion', () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    const completeQuestButton = screen.getByTestId('complete-quest');
    
    // Initial state
    let gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    const initialXp = gameState.user?.xp || 0;
    const initialCoins = gameState.user?.coins || 0;
    const initialCompletedQuests = gameState.completedQuests.length;

    // Complete quest
    fireEvent.click(completeQuestButton);
    
    // Check updated state
    gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    expect(gameState.user.xp).toBe(initialXp + 100); // Quest XP reward
    expect(gameState.user.coins).toBe(initialCoins + 50); // Quest coin reward
    expect(gameState.completedQuests).toHaveLength(initialCompletedQuests + 1);
    expect(gameState.completedQuests).toContain('test-quest');
  });

  it('should handle achievement unlocks', () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    const unlockButton = screen.getByTestId('unlock-achievement');
    
    // Initial state
    let gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    const initialXp = gameState.user?.xp || 0;
    const initialCoins = gameState.user?.coins || 0;
    const initialAchievements = gameState.achievements.length;

    // Unlock achievement
    fireEvent.click(unlockButton);
    
    // Check updated state
    gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    expect(gameState.user.xp).toBe(initialXp + 200); // Achievement XP reward
    expect(gameState.user.coins).toBe(initialCoins + 100); // Achievement coin reward
    expect(gameState.achievements).toHaveLength(initialAchievements + 1);
    expect(gameState.achievements[0]).toMatchObject({
      id: 'test-achievement',
      unlocked: true,
      progress: 100
    });
  });

  it('should handle user profile updates', () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    const updateButton = screen.getByTestId('update-user');
    
    // Update user profile
    fireEvent.click(updateButton);
    
    // Check updated state
    const gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    expect(gameState.user).toMatchObject({
      name: 'Test User',
      level: 2,
      xp: 1500,
      coins: 1000
    });
  });

  it('should handle battle stats updates', () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    let gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    
    // Update battle stats through dispatch
    act(() => {
      const { dispatch } = useGame();
      dispatch({
        type: 'UPDATE_BATTLE_STATS',
        payload: {
          total_battles: 1,
          wins: 1,
          win_streak: 1,
          total_xp_earned: 100,
          total_coins_earned: 50
        }
      });
    });

    // Verify battle stats update
    gameState = JSON.parse(screen.getByTestId('game-state').textContent || '{}');
    expect(gameState.battle_stats).toMatchObject({
      total_battles: 1,
      wins: 1,
      win_streak: 1,
      total_xp_earned: 100,
      total_coins_earned: 50
    });
  });
}); 