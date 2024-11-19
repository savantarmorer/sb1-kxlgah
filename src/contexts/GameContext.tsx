import { createContext, useContext, useReducer, useEffect } from 'react';
import { User, InventoryItem, Challenge } from '../types';
import { Achievement } from '../types/achievements';
import { LevelSystem } from '../lib/levelSystem';
import { XP_MULTIPLIERS } from '../lib/gameConfig';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';
import { getUserProgress, updateUserProgress } from '../lib/supabase';
import { formatISO } from 'date-fns';
import { Quest } from '../types/quests';
import { GameItem } from '../types/items';
import { GameAction } from '../types/actions';
import { Reward, RewardRarity, isNumericReward } from '../types/rewards';
import { notifyAchievementUnlock } from '../utils/achievementSubscription';
import { supabase } from '../lib/supabase';
import { ACHIEVEMENT_CATEGORIES } from '../components/Achievements/AchievementSystem';
import { NotificationSystem } from '../utils/notificationSystem';

/**
 * Interface for reward multipliers
 * Used by:
 * - XP calculations
 * - Coin calculations
 * - Streak bonus system
 */
interface RewardMultipliers {
  xp: number;
  coins: number;
}

/**
 * Interface for game statistics
 * Used by:
 * - Admin dashboard
 * - Analytics system
 * Dependencies:
 * - Supabase for data storage
 */
interface GameStatistics {
  lastUpdated: string;
  activeUsers: number;
  completedQuests: number;
  purchasedItems: number;
}

/**
 * Interface for level up rewards
 * Used by:
 * - Level system
 * - Reward notifications
 * Dependencies:
 * - RewardRarity from rewards.ts
 */
interface LevelUpReward {
  type: string;
  value: number | string;
  rarity: RewardRarity;
}

/**
 * Interface for game state
 * Core state interface used throughout the application
 * Dependencies:
 * - User interface
 * - Achievement system
 * - Quest system
 * - Inventory system
 */
interface GameState {
  user: {
    rewardMultipliers: {
      xp: number;
      coins: number;
    };
    streakMultiplier: number;
    id: string;
    name: string;
    email: string;
    level: number;
    xp: number;
    streak: number;
    coins: number;
    achievements: Achievement[];
    inventory: any[];
    studyTime: number;
    constitutionalScore: number;
    civilScore: number;
    criminalScore: number;
    administrativeScore: number;
    sharedAchievements: any[];
    roles: string[];
    avatar: string | null;
    title: string | null;
  };
  achievements: Achievement[];
  recentXPGains: {
    amount: number;
    reason: string;
    timestamp: string;
    isCritical: boolean;
  }[];
  completedQuests: string[];
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
  debugMode: boolean;
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
    email: '',
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
    roles: [],
    avatar: null,
    title: null
  },
  achievements: [
    {
      id: 'first_login',
      title: 'First Steps',
      description: 'Login for the first time',
      category: 'progress',
      points: 10,
      rarity: 'common',
      unlocked: false,
      unlockedAt: new Date(),
      prerequisites: [],
      dependents: [],
      triggerConditions: [{
        type: 'login_days',
        value: 1,
        comparison: 'gte'
      }],
      order: 1,
      progress: 0
    },
    // Add more default achievements here
  ],
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
  },
  debugMode: false
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
function convertQuest(quest: Quest): Quest {
  return {
    ...quest,
    requirements: quest.requirements.map(req => ({
      ...req,
      value: typeof req.value === 'string' ? parseInt(req.value, 10) : req.value,
      type: req.type
    }))
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

    case 'ADD_XP': {
      const oldLevel = state.user.level;
      const streakMultiplier = XP_MULTIPLIERS.streak[state.user.streak as keyof typeof XP_MULTIPLIERS.streak] || 1;
      const isCritical = Math.random() < XP_MULTIPLIERS.critical.chance;
      const criticalMultiplier = isCritical ? XP_MULTIPLIERS.critical.multiplier : 1;
      
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
        ...state,
        user: {
          ...state.user,
          xp: newXP,
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
        ...state,
        user: {
          ...state.user,
          coins: state.user.coins - action.payload.cost,
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

    case 'DISMISS_LEVEL_UP_REWARD':
      return {
        ...state,
        showLevelUpReward: false,
        currentLevelRewards: null
      };

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

    case 'UPDATE_REWARD_MULTIPLIERS': {
      const multipliers: RewardMultipliers = {
        xp: action.payload.xp || 1,
        coins: action.payload.coins || 1
      };
      
      return {
        ...state,
        user: {
          ...state.user,
          rewardMultipliers: multipliers
        }
      };
    }

    case 'SYNC_START':
      return { ...state, syncing: true };

    case 'SYNC_SUCCESS': {
      const userData = action.payload.user;
      if (!userData) return state;

      const convertedUser: User & { rewardMultipliers: RewardMultipliers; streakMultiplier?: number } = {
        ...state.user,
        ...userData,
        rewardMultipliers: userData.rewardMultipliers || { xp: 1, coins: 1 },
        streakMultiplier: userData.streakMultiplier || state.user.streakMultiplier
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
      
      if (isNumericReward(action.payload)) {
        if (type === 'xp') {
          updatedState = gameReducer(state, {
            type: 'ADD_XP',
            payload: {
              amount: action.payload.value,
              reason: `${rarity} Reward Claimed`
            }
          });
        } else if (type === 'coins') {
          updatedState = gameReducer(state, {
            type: 'ADD_COINS',
            payload: action.payload.value
          });
        }
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

    case 'INITIALIZE_QUESTS': {
      return {
        ...state,
        quests: action.payload.map(quest => convertQuest(quest))
      };
    }

    case 'ADD_TO_INVENTORY': {
      const { item } = action.payload;
      return {
        ...state,
        user: {
          ...state.user,
          inventory: [...state.user.inventory, {
            ...item,
            type: item.type as "material" | "booster" | "cosmetic"
          }]
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
        currentLevelRewards: rewards
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

    case 'ADD_QUEST': {
      const quest = action.payload;
      return {
        ...state,
        quests: [...state.quests, quest],
        // Also update user if quest is completed
        user: quest.status === 'completed' ? {
          ...state.user,
          xp: state.user.xp + quest.xpReward,
          coins: state.user.coins + quest.coinReward
        } : state.user
      };
    }

    case 'UPDATE_QUEST': {
      const updatedQuest = action.payload;
      const oldQuest = state.quests.find(q => q.id === updatedQuest.id);
      
      // If quest was just completed, give rewards
      const justCompleted = oldQuest?.status !== 'completed' && updatedQuest.status === 'completed';
      
      return {
        ...state,
        quests: state.quests.map(quest => 
          quest.id === updatedQuest.id ? updatedQuest : quest
        ),
        user: justCompleted ? {
          ...state.user,
          xp: state.user.xp + updatedQuest.xpReward,
          coins: state.user.coins + updatedQuest.coinReward
        } : state.user
      };
    }

    case 'REMOVE_QUEST':
      return {
        ...state,
        quests: state.quests.filter(quest => quest.id !== action.payload)
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

    case 'SET_USER':
      console.log('GameReducer: Setting user with payload:', action.payload);
      const isAdmin = action.payload.email === 'admin@admin';
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
          roles: isAdmin ? ['admin', 'user', 'premium'] : (action.payload.roles || ['user']),
          level: isAdmin ? 99 : (action.payload.level || state.user.level),
          xp: isAdmin ? 10000 : (action.payload.xp || state.user.xp),
          coins: isAdmin ? 999999 : (action.payload.coins || state.user.coins),
          rewardMultipliers: action.payload.rewardMultipliers || state.user.rewardMultipliers,
          streakMultiplier: action.payload.streakMultiplier || state.user.streakMultiplier
        },
        debugMode: isAdmin || state.debugMode
      };

    case 'TOGGLE_DEBUG_MODE':
      console.log('GameReducer: Toggling debug mode');
      return {
        ...state,
        debugMode: !state.debugMode
      };

    case 'UPDATE_ACHIEVEMENT':
      return {
        ...state,
        achievements: state.achievements.map(achievement =>
          achievement.id === action.payload.id ? action.payload : achievement
        )
      };

    case 'REMOVE_ACHIEVEMENT':
      return {
        ...state,
        achievements: state.achievements.filter(achievement => achievement.id !== action.payload)
      };

    case 'ADD_ACHIEVEMENT':
      return {
        ...state,
        achievements: [...state.achievements, action.payload]
      };

    case 'SHOW_NOTIFICATION': {
      const { type, message } = action.payload;
      try {
        switch (type) {
          case 'achievement':
            NotificationSystem.showAchievement(message as Achievement);
            break;
          case 'quest':
            NotificationSystem.showQuestComplete(message as Quest);
            break;
          case 'reward':
            NotificationSystem.showReward(message as Reward);
            break;
          case 'error':
            NotificationSystem.showError(message as string);
            break;
          case 'success':
            NotificationSystem.showSuccess(message as string);
            break;
          default:
            console.warn('Unknown notification type:', type);
        }
      } catch (error) {
        console.error('Error showing notification:', error);
      }
      return state;
    }

    default:
      return state;
  }
}

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | undefined>(undefined);

/**
 * Game Context Provider
 * 
 * Role:
 * - Central state management
 * - Game logic coordination
 * - Data persistence
 * 
 * Dependencies:
 * - React Context API
 * - Supabase for data storage
 * - Level System for XP calculations
 * - Achievement System for unlocks
 * - Quest System for progress
 * 
 * Used By:
 * - All game components
 * - Admin components
 * - Battle system
 * - Reward system
 * 
 * Features:
 * - State management
 * - Action dispatching
 * - Data synchronization
 * - Progress tracking
 * 
 * Scalability:
 * - Modular action types
 * - Extensible state structure
 * - Optimized updates
 * - Type safety
 */
export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { user } = useAuth();
  const { setValue: saveState } = useLocalStorage('gameState', initialState);

  // Sync user data with auth state
  useEffect(() => {
    if (user) {
      console.log('GameProvider: Current user data:', user);
      console.log('GameProvider: User roles:', user.roles);
      
      // Ensure admin privileges are set
      if (user.email === 'admin@admin') {
        const adminUser = {
          ...user,
          roles: ['admin', 'user', 'premium'],
          level: 99,
          xp: 10000,
          coins: 999999,
          streak: 0,
          studyTime: 0,
          constitutionalScore: 100,
          civilScore: 100,
          criminalScore: 100,
          administrativeScore: 100,
          debugMode: true,
          is_super_admin: true
        };
        
        console.log('Setting admin user:', adminUser);
        
        // Update Supabase profile
        supabase
          .from('profiles')
          .upsert({
            id: user.id,
            name: 'Admin',
            is_super_admin: true,
            level: 99,
            xp: 10000,
            coins: 999999,
            updated_at: new Date().toISOString()
          })
          .then(() => {
            dispatch({
              type: 'SET_USER',
              payload: adminUser
            });
          });
      } else {
        dispatch({
          type: 'SET_USER',
          payload: user
        });
      }
    }
  }, [user]);

  // Save state to localStorage on changes
  useEffect(() => {
    console.log('GameProvider: Saving state:', state);
    saveState(state);
  }, [state, saveState]);

  // Add debug logging for state changes
  useEffect(() => {
    console.log('Current game state:', state);
    console.log('User roles:', state.user.roles);
    console.log('Is admin?', state.user.roles?.includes('admin'));
  }, [state]);

  // Check login streak
  useEffect(() => {
    if (user) {
      const today = formatISO(new Date(), { representation: 'date' });
      if (today !== state.lastLoginDate) {
        dispatch({ type: 'RECORD_LOGIN', payload: today });
        dispatch({ type: 'SET_LAST_LOGIN', payload: today });
      }
    }
  }, [user, state.lastLoginDate]);

  // Sync user data periodically
  useEffect(() => {
    if (user && !state.syncing) {
      const syncData = {
        xp: state.user.xp,
        level: state.user.level,
        coins: state.user.coins,
        streak: state.user.streak,
        achievements: state.user.achievements,
        inventory: state.user.inventory
      };

      updateUserProgress(user.id, syncData);
    }
  }, [state.user.xp, state.user.level, state.user.coins, state.user.streak, user]);

  // Sync statistics for admin users
  useEffect(() => {
    if (user?.roles?.includes('admin')) {
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
  }, [user]);

  // Add quest synchronization
  useEffect(() => {
    if (user) {
      const syncQuests = async () => {
        const { data: questsData } = await supabase
          .from('quests')
          .select('*')
          .eq('user_id', user.id);

        if (questsData) {
          dispatch({
            type: 'INITIALIZE_QUESTS',
            payload: questsData.map(quest => convertQuest(quest))
          });
        }
      };

      syncQuests();
    }
  }, [user]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

/**
 * Hook for accessing game context
 * @returns Game context value
 * @throws Error if used outside GameProvider
 */
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

/**
 * Add this helper function to check admin status
 * @param state - Current game state
 * @returns True if the user is an admin, false otherwise
 */
export function isAdmin(state: GameState): boolean {
  return state.user.roles?.includes('admin') || false;
}

/**
 * Add this helper function to check debug mode
 * @param state - Current game state
 * @returns True if the user is in debug mode, false otherwise
 */
export function isDebugMode(state: GameState): boolean {
  return state.debugMode || state.user.roles?.includes('admin') || false;
}
