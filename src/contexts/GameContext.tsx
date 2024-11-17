<<<<<<< HEAD
import { createContext, useContext, useReducer, useEffect } from 'react';
import { User, InventoryItem } from '../types';
import { Achievement } from '../types/achievements';
=======
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, Achievement, LeaderboardEntry } from '../types';
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
import { LevelSystem } from '../lib/levelSystem';
import { XP_MULTIPLIERS } from '../lib/gameConfig';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';
<<<<<<< HEAD
import { getUserProgress, updateUserProgress } from '../lib/supabase';
import { formatISO } from 'date-fns';
import { Quest, QuestType, QuestRequirement, QuestRequirementType } from '../types/quests';
import { GameItem } from '../types/items';
import { GameAction } from '../types/actions';
import { RewardRarity } from '../types/rewards';
import { notifyAchievementUnlock } from '../utils/achievementSubscription';
import { supabase } from '../lib/supabase';

/**
 * Interface for game statistics
 * Used for admin dashboard metrics
 */
interface GameStatistics {
  lastUpdated: string;
  activeUsers: number;
  completedQuests: number;
  purchasedItems: number;
}

/**
 * Interface for level up rewards
 */
interface LevelUpReward {
  type: string;
  value: number | string;
  rarity: RewardRarity;
}

/**
 * Interface for game state
 */
interface GameState {
  user: User & {
    rewardMultipliers?: {
      xp: number;
      coins: number;
    };
    streakMultiplier?: number;
  };
  achievements: Achievement[];
=======
import { supabase, subscribeToUserProgress, updateUserProgress, getUserProgress } from '../lib/supabase';

interface GameState {
  user: User;
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
  recentXPGains: {
    amount: number;
    reason: string;
    timestamp: string;
    isCritical: boolean;
  }[];
  completedQuests: string[];
<<<<<<< HEAD
  quests: Quest[];
  leaderboard: {
    userId: string;
    username: string;
    score: number;
    rank: number;
    avatar: string;
  }[];
  showLevelUpReward: boolean;
  currentLevelRewards: LevelUpReward[] | null;
  syncing: boolean;
  loginHistory: string[];
  lastLoginDate: string | null;
  items: GameItem[];
  statistics: GameStatistics;
}

const initialState: GameState = {
  user: {
    rewardMultipliers: {
      xp: 1,
      coins: 1
    },
    streakMultiplier: 1,
    id: '',
    name: '',
    level: 1,
    xp: 0,
    streak: 0,
    coins: 0,
    achievements: [],
    inventory: [],
    studyTime: 0,
    constitutionalScore: 0,
    civilScore: 0,
    criminalScore: 0,
    administrativeScore: 0,
    sharedAchievements: [],
    roles: []
  },
  achievements: [],
  recentXPGains: [],
  completedQuests: [],
  quests: [],
  leaderboard: [],
  showLevelUpReward: false,
  currentLevelRewards: null,
  syncing: false,
  loginHistory: [],
  lastLoginDate: null,
  items: [],
  statistics: {
    lastUpdated: new Date().toISOString(),
    activeUsers: 0,
    completedQuests: 0,
    purchasedItems: 0
  }
};

/**
 * Fetches system statistics from the database
 * Used by admin dashboard and statistics components
 */
const fetchStatistics = async () => {
  try {
    const { data: usersData } = await getUserProgress('users');
    const { data: questsData } = await getUserProgress('quests');
    const { data: itemsData } = await getUserProgress('items');

    return {
      activeUsers: (usersData || []).length,
      completedQuests: (questsData || []).length,
      purchasedItems: (itemsData || []).length,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return null;
  }
};

/**
 * Converts Quest from database to frontend format
 * Ensures type compatibility between different Quest versions
 */
function convertQuest(quest: any): Quest {
  return {
    ...quest,
    requirements: quest.requirements?.map((req: any) => ({
      ...req,
      type: req.type as QuestRequirementType,
      id: req.id || String(Date.now()),
      completed: req.completed || false
    })) as QuestRequirement[],
    type: quest.type as QuestType,
    deadline: new Date(quest.deadline),
    progress: quest.progress || 0,
    metadata: quest.metadata || {}
  };
}

/**
 * Reducer for handling game state updates
 * @param state - Current game state
 * @param action - Action to perform
 * @returns Updated game state
 */
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'RECORD_LOGIN':
      return {
        ...state,
        loginHistory: Array.isArray(state.loginHistory) 
          ? [...state.loginHistory, action.payload]
          : [action.payload]
      };
=======
  leaderboard: LeaderboardEntry[];
  showLevelUpReward: boolean;
  currentLevelRewards: any[] | null;
  syncing: boolean;
}

type GameAction =
  | { type: 'ADD_XP'; payload: { amount: number; reason: string } }
  | { type: 'ADD_COINS'; payload: number }
  | { type: 'COMPLETE_QUEST'; payload: string }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: Achievement }
  | { type: 'PURCHASE_ITEM'; payload: { itemId: string; cost: number } }
  | { type: 'UPDATE_PROFILE'; payload: Partial<User> }
  | { type: 'DISMISS_LEVEL_UP_REWARD' }
  | { type: 'SYNC_START' }
  | { type: 'SYNC_SUCCESS'; payload: Partial<GameState> }
  | { type: 'SYNC_ERROR' };

const initialState: GameState = {
  user: {
    id: '1',
    name: 'Maria Silva',
    level: 1,
    xp: 0,
    streak: 7,
    coins: 1000,
    achievements: [],
    inventory: []
  },
  recentXPGains: [],
  completedQuests: [],
  leaderboard: [
    {
      userId: '1',
      username: 'Maria Silva',
      score: 0,
      rank: 1,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    }
  ],
  showLevelUpReward: false,
  currentLevelRewards: null,
  syncing: false
};

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | undefined>(undefined);

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SYNC_START':
      return { ...state, syncing: true };

    case 'SYNC_SUCCESS':
      return { ...state, ...action.payload, syncing: false };

    case 'SYNC_ERROR':
      return { ...state, syncing: false };
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d

    case 'ADD_XP': {
      const oldLevel = state.user.level;
      const streakMultiplier = XP_MULTIPLIERS.streak[state.user.streak as keyof typeof XP_MULTIPLIERS.streak] || 1;
      const isCritical = Math.random() < XP_MULTIPLIERS.critical.chance;
      const criticalMultiplier = isCritical ? XP_MULTIPLIERS.critical.multiplier : 1;
      
<<<<<<< HEAD
      const finalXP = Math.floor(action.payload.amount * streakMultiplier * criticalMultiplier);
      const newXP = state.user.xp + finalXP;
      const newLevel = LevelSystem.calculateLevel(newXP);
      
      let levelUpRewards: LevelUpReward[] | null = null;
      
      if (newLevel > oldLevel) {
        levelUpRewards = [
          {
            type: 'xp',
            value: 500 * newLevel,
            rarity: (newLevel % 10 === 0 ? 'legendary' : newLevel % 5 === 0 ? 'epic' : 'rare') as RewardRarity
          },
          {
            type: 'coins',
            value: 200 * newLevel,
            rarity: 'rare'
          }
        ];

        if (newLevel % 10 === 0) {
          levelUpRewards.push({
            type: 'item',
            value: `Level ${newLevel} Legendary Title`,
            rarity: 'legendary'
          });
        } else if (newLevel % 5 === 0) {
          levelUpRewards.push({
            type: 'item',
            value: `Level ${newLevel} Epic Title`,
            rarity: 'epic'
          });
        }

        const newAchievements = [...state.achievements];
        if (newLevel % 5 === 0) {
          newAchievements.push({
            id: `level_${newLevel}`,
            title: `Level ${newLevel} Master`,
            description: `Reach level ${newLevel}`,
            category: 'progress',
            points: newLevel * 10,
            unlocked: true,
            rarity: newLevel % 10 === 0 ? 'legendary' : 'epic',
            unlockedAt: new Date(),
            prerequisites: [],
            dependents: [],
            triggerConditions: [{
              type: 'xp',
              value: newLevel,
              comparison: 'gte'
            }],
            order: newLevel
          });
        }

        return {
          ...state,
          achievements: newAchievements,
          user: {
            ...state.user,
            xp: newXP,
            level: newLevel,
            coins: state.user.coins + (levelUpRewards?.find(r => r.type === 'coins')?.value as number || 0)
          },
          recentXPGains: [
            {
              amount: finalXP,
              reason: action.payload.reason + (isCritical ? ' (Critical!)' : ''),
              timestamp: new Date().toISOString(),
              isCritical
            },
            ...state.recentXPGains.slice(0, 4)
          ],
          showLevelUpReward: Boolean(levelUpRewards),
          currentLevelRewards: levelUpRewards
        };
      }

      return {
=======
      const finalXP = Math.floor(
        action.payload.amount * streakMultiplier * criticalMultiplier
      );
      
      const newXP = state.user.xp + finalXP;
      const newLevel = LevelSystem.calculateLevel(newXP);
      
      let coinsToAdd = 0;
      let levelUpRewards = null;

      if (newLevel > oldLevel) {
        const rewards = LevelSystem.handleLevelUp(state.user, oldLevel, newLevel);
        coinsToAdd = rewards.reduce((sum, reward) => sum + reward.coins, 0);
        levelUpRewards = rewards.flatMap(reward => reward.items);
      }

      const newGain = {
        amount: finalXP,
        reason: action.payload.reason + (isCritical ? ' (Critical!)' : ''),
        timestamp: new Date().toISOString(),
        isCritical
      };

      const updatedLeaderboard = [...state.leaderboard];
      const userIndex = updatedLeaderboard.findIndex(entry => entry.userId === state.user.id);
      if (userIndex !== -1) {
        updatedLeaderboard[userIndex] = {
          ...updatedLeaderboard[userIndex],
          score: newXP
        };
        updatedLeaderboard.sort((a, b) => b.score - a.score);
        updatedLeaderboard.forEach((entry, index) => {
          entry.rank = index + 1;
        });
      }

      const newState = {
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
        ...state,
        user: {
          ...state.user,
          xp: newXP,
<<<<<<< HEAD
          level: newLevel
        },
        recentXPGains: [
          {
            amount: finalXP,
            reason: action.payload.reason + (isCritical ? ' (Critical!)' : ''),
            timestamp: new Date().toISOString(),
            isCritical
          },
          ...state.recentXPGains.slice(0, 4)
        ]
      };
    }

    case 'ADD_COINS':
      return {
        ...state,
        user: {
          ...state.user,
          coins: state.user.coins + action.payload
        }
      };

    case 'COMPLETE_QUEST':
      return {
        ...state,
        completedQuests: [...state.completedQuests, action.payload]
      };

    case 'UNLOCK_ACHIEVEMENT':
      if (!state.achievements) {
        state.achievements = [];
      }
      if (state.achievements.some(a => a.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        achievements: [...state.achievements, action.payload],
        user: {
          ...state.user,
          achievements: state.user.achievements 
            ? [...state.user.achievements, action.payload]
            : [action.payload]
        }
      };

    case 'PURCHASE_ITEM':
      if (state.user.coins < action.payload.cost) {
        return state;
      }
      return {
=======
          level: newLevel,
          coins: state.user.coins + coinsToAdd
        },
        recentXPGains: [newGain, ...state.recentXPGains.slice(0, 4)],
        leaderboard: updatedLeaderboard,
        showLevelUpReward: levelUpRewards !== null,
        currentLevelRewards: levelUpRewards
      };

      // Sync with Supabase
      updateUserProgress(state.user.id, {
        xp: newXP,
        level: newLevel,
        coins: state.user.coins + coinsToAdd
      });

      return newState;
    }

    case 'ADD_COINS': {
      const newState = {
        ...state,
        user: {
          ...state.user,
          coins: Math.max(0, state.user.coins + action.payload)
        }
      };

      // Sync with Supabase
      updateUserProgress(state.user.id, {
        coins: newState.user.coins
      });

      return newState;
    }

    case 'COMPLETE_QUEST': {
      const newState = {
        ...state,
        completedQuests: [...(state.completedQuests || []), action.payload]
      };

      // Sync with Supabase
      updateUserProgress(state.user.id, {
        completed_quests: newState.completedQuests
      });

      return newState;
    }

    case 'UNLOCK_ACHIEVEMENT': {
      if (state.user.achievements.some(a => a.id === action.payload.id)) {
        return state;
      }

      const newState = {
        ...state,
        user: {
          ...state.user,
          achievements: [...state.user.achievements, action.payload]
        }
      };

      // Sync with Supabase
      updateUserProgress(state.user.id, {
        achievements: newState.user.achievements
      });

      return newState;
    }

    case 'PURCHASE_ITEM': {
      if (state.user.coins < action.payload.cost) {
        return state;
      }

      const newState = {
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
        ...state,
        user: {
          ...state.user,
          coins: state.user.coins - action.payload.cost,
<<<<<<< HEAD
          inventory: [...state.user.inventory, { id: action.payload.itemId, name: action.payload.itemId, type: 'material', rarity: 'common', description: '' }]
        }
      };

    case 'UPDATE_USER_PROFILE':
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload
        }
      };

=======
          inventory: [
            ...state.user.inventory,
            {
              id: action.payload.itemId,
              name: action.payload.itemId,
              description: '',
              type: 'material',
              rarity: 'common'
            }
          ]
        }
      };

      // Sync with Supabase
      updateUserProgress(state.user.id, {
        coins: newState.user.coins,
        inventory: newState.user.inventory
      });

      return newState;
    }

    case 'UPDATE_PROFILE': {
      const updatedUser = { ...state.user, ...action.payload };
      const updatedLeaderboard = state.leaderboard.map(entry =>
        entry.userId === state.user.id
          ? { ...entry, username: updatedUser.name, avatar: updatedUser.avatar || entry.avatar }
          : entry
      );
      
      const newState = {
        ...state,
        user: updatedUser,
        leaderboard: updatedLeaderboard
      };

      // Sync with Supabase
      updateUserProgress(state.user.id, action.payload);

      return newState;
    }

>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
    case 'DISMISS_LEVEL_UP_REWARD':
      return {
        ...state,
        showLevelUpReward: false,
        currentLevelRewards: null
      };

<<<<<<< HEAD
    case 'INCREMENT_STREAK':
      return {
        ...state,
        user: {
          ...state.user,
          streak: state.user.streak + 1
        }
      };

    case 'RESET_STREAK':
      return {
        ...state,
        user: {
          ...state.user,
          streak: 0
        }
      };

    case 'SET_LAST_LOGIN':
      return {
        ...state,
        lastLoginDate: action.payload
      };

    case 'SYNC_QUEST_PROGRESS':
      return {
        ...state,
        quests: state.quests.map(quest =>
          quest.id === action.payload.questId
            ? { ...quest, progress: action.payload.progress }
            : quest
        )
      };

    case 'UPDATE_REWARD_MULTIPLIERS':
      return {
        ...state,
        user: {
          ...state.user,
          rewardMultipliers: action.payload
        }
      };

    case 'SYNC_START':
      return { ...state, syncing: true };

    case 'SYNC_SUCCESS': {
      const userData = action.payload.user;
      if (!userData) return state;

      const convertedUser: User = {
        ...state.user,
        id: userData.id || state.user.id,
        name: userData.name || state.user.name,
        level: userData.level || state.user.level,
        xp: userData.xp || state.user.xp,
        streak: userData.streak || state.user.streak,
        coins: userData.coins || state.user.coins,
        achievements: (userData.achievements || []) as Achievement[],
        inventory: (userData.inventory || []) as InventoryItem[],
        studyTime: userData.studyTime || state.user.studyTime,
        constitutionalScore: userData.constitutionalScore || state.user.constitutionalScore,
        civilScore: userData.civilScore || state.user.civilScore,
        criminalScore: userData.criminalScore || state.user.criminalScore,
        administrativeScore: userData.administrativeScore || state.user.administrativeScore,
        sharedAchievements: userData.sharedAchievements || state.user.sharedAchievements,
        roles: userData.roles || state.user.roles
      };

      return {
        ...state,
        user: convertedUser,
        syncing: false
      };
    }

    case 'SYNC_ERROR':
      return { ...state, syncing: false };

    case 'CLAIM_REWARD': {
      const { type, value, rarity } = action.payload;
      let updatedState = { ...state };
      
      if (type === 'xp') {
        updatedState = gameReducer(state, {
          type: 'ADD_XP',
          payload: {
            amount: value,
            reason: `${rarity} Reward Claimed`
          }
        });
      } else if (type === 'coins') {
        updatedState = gameReducer(state, {
          type: 'ADD_COINS',
          payload: value
        });
      }
      
      return updatedState;
    }

    case 'UPDATE_STREAK_MULTIPLIER': {
      const streakMultiplier = XP_MULTIPLIERS.streak[state.user.streak as keyof typeof XP_MULTIPLIERS.streak] || 1;
      return {
        ...state,
        user: {
          ...state.user,
          streakMultiplier
        }
      };
    }

    case 'INITIALIZE_QUESTS':
      return {
        ...state,
        quests: action.payload.map(quest => convertQuest(quest))
      };

    case 'ADD_TO_INVENTORY': {
      const { item } = action.payload;
      return {
        ...state,
        user: {
          ...state.user,
          inventory: [...state.user.inventory, item]
        }
      };
    }

    case 'REMOVE_FROM_INVENTORY': {
      const { itemId } = action.payload;
      return {
        ...state,
        user: {
          ...state.user,
          inventory: state.user.inventory.filter(item => item.id !== itemId)
        }
      };
    }

    case 'EQUIP_ITEM': {
      const { itemId } = action.payload;
      const item = state.user.inventory.find(i => i.id === itemId);
      const currentBackpack = state.user.backpack || [];
      
      if (!item || currentBackpack.length >= 10) return state;

      return {
        ...state,
        user: {
          ...state.user,
          backpack: [...currentBackpack, item]
        }
      };
    }

    case 'UNEQUIP_ITEM': {
      const { itemId } = action.payload;
      return {
        ...state,
        user: {
          ...state.user,
          backpack: state.user.backpack?.filter(item => item.id !== itemId) || []
        }
      };
    }

    case 'UPDATE_ACHIEVEMENT_PROGRESS': {
      const { id, progress } = action.payload;
      const updatedAchievements = state.achievements.map(achievement => {
        if (achievement.id === id) {
          const wasUnlocked = achievement.unlocked;
          const shouldUnlock = progress >= 100;
          
          if (!wasUnlocked && shouldUnlock) {
            notifyAchievementUnlock({
              ...achievement,
              unlocked: true,
              unlockedAt: new Date(),
              progress: 100
            });
          }

          return {
            ...achievement,
            progress,
            unlocked: shouldUnlock,
            unlockedAt: shouldUnlock && !wasUnlocked ? new Date() : achievement.unlockedAt
          };
        }
        return achievement;
      });

      return {
        ...state,
        achievements: updatedAchievements,
        user: {
          ...state.user,
          achievements: updatedAchievements
        }
      };
    }

    case 'NOTIFY_ACHIEVEMENT': {
      // This case is mainly for tracking achievement notifications
      // The actual unlock is handled by UNLOCK_ACHIEVEMENT
      return state;
    }

    case 'SET_USER_ROLE': {
      return {
        ...state,
        user: {
          ...state.user,
          roles: action.payload
        }
      };
    }

    case 'LEVEL_UP': {
      const { newLevel, rewards } = action.payload;
      return {
        ...state,
        user: {
          ...state.user,
          level: newLevel
        },
        showLevelUpReward: true,
        currentLevelRewards: rewards.flatMap((r: { items: any[] }) => r.items)
      };
    }

    case 'ADD_ITEM': {
      return {
        ...state,
        items: [...state.items, action.payload]
      };
    }

    case 'UPDATE_ITEM': {
      return {
        ...state,
        items: state.items.map(item => 
          item.id === action.payload.id ? action.payload : item
        )
      };
    }

    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.id)
      };
    }

    case 'SYNC_ITEMS': {
      return {
        ...state,
        items: action.payload
      };
    }

    case 'ADD_QUEST':
      return {
        ...state,
        quests: [...state.quests, convertQuest(action.payload)]
      };

    case 'UPDATE_QUEST':
      return {
        ...state,
        quests: state.quests.map(quest => 
          quest.id === action.payload.id ? convertQuest(action.payload) : quest
        )
      };

    case 'REMOVE_QUEST':
      return {
        ...state,
        quests: state.quests.filter(quest => quest.id !== action.payload.id)
      };

    case 'SYNC_STATISTICS': {
      return {
        ...state,
        statistics: {
          ...state.statistics,
          ...action.payload
        }
      };
    }

=======
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
    default:
      return state;
  }
}

<<<<<<< HEAD
const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | undefined>(undefined);

/**
 * Game context provider component
 * Manages global game state and synchronization
 */
=======
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuth();
  const [savedState, setSavedState] = useLocalStorage<GameState>('gameState', initialState);
  const [state, dispatch] = useReducer(gameReducer, savedState || initialState);

<<<<<<< HEAD
  // Sync with database on auth user change
  useEffect(() => {
    if (authUser) {
      dispatch({ type: 'SYNC_START' });
      getUserProgress(authUser.id).then(({ data }) => {
        if (data) {
=======
  // Initial data load
  useEffect(() => {
    if (authUser) {
      dispatch({ type: 'SYNC_START' });
      
      getUserProgress(authUser.id)
        .then(({ data, error }) => {
          if (error) {
            console.error('Error loading user progress:', error);
            dispatch({ type: 'SYNC_ERROR' });
            return;
          }

          if (data) {
            dispatch({
              type: 'SYNC_SUCCESS',
              payload: {
                user: {
                  ...state.user,
                  ...data,
                  id: authUser.id
                }
              }
            });
          }
        });
    }
  }, [authUser]);

  // Set up real-time subscription
  useEffect(() => {
    if (authUser) {
      const subscription = subscribeToUserProgress(authUser.id, (payload) => {
        if (payload.new) {
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
          dispatch({
            type: 'SYNC_SUCCESS',
            payload: {
              user: {
                ...state.user,
<<<<<<< HEAD
                ...data,
                id: authUser.id
=======
                ...payload.new
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
              }
            }
          });
        }
      });
<<<<<<< HEAD
    }
  }, [authUser]);

  // Save state to localStorage on changes
=======

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [authUser]);

  // Save state to localStorage
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
  useEffect(() => {
    setSavedState(state);
  }, [state, setSavedState]);

<<<<<<< HEAD
  // Check login streak
  useEffect(() => {
    if (authUser) {
      const today = formatISO(new Date(), { representation: 'date' });
      if (today !== state.lastLoginDate) {
        dispatch({ type: 'RECORD_LOGIN', payload: today });
        dispatch({ type: 'SET_LAST_LOGIN', payload: today });
      }
    }
  }, [authUser, state.lastLoginDate]);

  // Sync user data periodically
  useEffect(() => {
    if (authUser && !state.syncing) {
      const syncData = {
        xp: state.user.xp,
        level: state.user.level,
        coins: state.user.coins,
        streak: state.user.streak,
        achievements: state.user.achievements,
        inventory: state.user.inventory
      };

      updateUserProgress(authUser.id, syncData);
    }
  }, [state.user.xp, state.user.level, state.user.coins, state.user.streak, authUser]);

  // Sync statistics for admin users
  useEffect(() => {
    if (authUser?.roles?.includes('admin')) {
      const syncStatistics = async () => {
        const stats = await fetchStatistics();
        if (stats) {
          dispatch({
            type: 'SYNC_STATISTICS',
            payload: stats
          });
        }
      };

      syncStatistics();
      const interval = setInterval(syncStatistics, 5 * 60 * 1000); // Every 5 minutes

      return () => clearInterval(interval);
    }
  }, [authUser]);

  // Add quest synchronization
  useEffect(() => {
    if (authUser) {
      const syncQuests = async () => {
        const { data: questsData } = await supabase
          .from('quests')
          .select('*')
          .eq('user_id', authUser.id);

        if (questsData) {
          dispatch({
            type: 'INITIALIZE_QUESTS',
            payload: questsData.map(quest => convertQuest(quest))
          });
        }
      };

      syncQuests();
    }
  }, [authUser]);

=======
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

<<<<<<< HEAD
/**
 * Hook for accessing game context
 * @returns Game context value
 * @throws Error if used outside GameProvider
 */
=======
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
<<<<<<< HEAD
}

/**
 * Component Dependencies:
 * - useAuth: For user authentication state
 * - useLocalStorage: For state persistence
 * - supabase: For database operations
 * 
 * State Management:
 * - Global game state through context
 * - Local storage persistence
 * - Database synchronization
 * 
 * Features:
 * - User progress tracking
 * - Achievement system
 * - Quest management
 * - Item management
 * - Statistics tracking
 * 
 * Scalability Considerations:
 * - Type conversion utilities
 * - Separate interfaces for state
 * - Periodic synchronization
 * - Error handling
 * - Type safety throughout
 */
=======
}
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
