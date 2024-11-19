/**
 * Database Schema Documentation
 * 
 * This file documents all database tables, relationships, and policies
 * used in the application. It serves as a reference for developers.
 */

export const DATABASE_SCHEMA = {
  tables: {
    profiles: {
      description: 'Core user data and progress',
      fields: {
        id: 'UUID PRIMARY KEY REFERENCES auth.users(id)',
        name: 'TEXT NOT NULL',
        email: 'TEXT UNIQUE',
        avatar: 'TEXT',
        title: 'TEXT',
        is_super_admin: 'BOOLEAN DEFAULT false',
        level: 'INTEGER DEFAULT 1',
        xp: 'INTEGER DEFAULT 0',
        coins: 'INTEGER DEFAULT 100',
        streak: 'INTEGER DEFAULT 0',
        study_time: 'INTEGER DEFAULT 0',
        constitutional_score: 'INTEGER DEFAULT 0',
        civil_score: 'INTEGER DEFAULT 0',
        criminal_score: 'INTEGER DEFAULT 0',
        administrative_score: 'INTEGER DEFAULT 0',
        created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
      },
      policies: [
        'Enable read access for all users',
        'Enable write access for own profile'
      ]
    },

    achievements: {
      description: 'Achievement definitions and metadata',
      fields: {
        id: 'TEXT PRIMARY KEY',
        title: 'TEXT NOT NULL',
        description: 'TEXT NOT NULL',
        category: 'TEXT NOT NULL',
        points: 'INTEGER NOT NULL DEFAULT 0',
        rarity: 'TEXT NOT NULL',
        unlocked: 'BOOLEAN DEFAULT false',
        unlocked_at: 'TIMESTAMP WITH TIME ZONE',
        prerequisites: 'TEXT[] DEFAULT ARRAY[]::TEXT[]',
        dependents: 'TEXT[] DEFAULT ARRAY[]::TEXT[]',
        trigger_conditions: 'JSONB DEFAULT \'[]\'::jsonb',
        order_num: 'INTEGER DEFAULT 0',
        created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
      },
      policies: [
        'Enable read access for all users',
        'Enable write access for admin users'
      ]
    },

    user_achievements: {
      description: 'Junction table for user-achievement relationships',
      fields: {
        user_id: 'UUID REFERENCES public.profiles(id)',
        achievement_id: 'TEXT REFERENCES public.achievements(id)',
        unlocked_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP',
        progress: 'INTEGER DEFAULT 0',
        PRIMARY_KEY: '(user_id, achievement_id)'
      }
    },

    quests: {
      description: 'Quest definitions and metadata',
      fields: {
        id: 'TEXT PRIMARY KEY',
        title: 'TEXT NOT NULL',
        description: 'TEXT NOT NULL',
        type: 'TEXT NOT NULL',
        status: 'TEXT NOT NULL DEFAULT \'available\'',
        xp_reward: 'INTEGER NOT NULL DEFAULT 0',
        coin_reward: 'INTEGER NOT NULL DEFAULT 0',
        requirements: 'JSONB DEFAULT \'[]\'::jsonb',
        category: 'TEXT NOT NULL',
        order_num: 'INTEGER DEFAULT 0',
        progress: 'INTEGER DEFAULT 0',
        is_active: 'BOOLEAN DEFAULT true',
        created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
      }
    },

    user_quests: {
      description: 'Junction table for user-quest relationships',
      fields: {
        user_id: 'UUID REFERENCES public.profiles(id)',
        quest_id: 'TEXT REFERENCES public.quests(id)',
        status: 'TEXT NOT NULL DEFAULT \'available\'',
        progress: 'INTEGER DEFAULT 0',
        started_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP',
        completed_at: 'TIMESTAMP WITH TIME ZONE',
        PRIMARY_KEY: '(user_id, quest_id)'
      }
    },

    items: {
      description: 'Game items and their properties',
      fields: {
        id: 'TEXT PRIMARY KEY',
        name: 'TEXT NOT NULL',
        description: 'TEXT NOT NULL',
        type: 'TEXT NOT NULL',
        rarity: 'TEXT NOT NULL',
        cost: 'INTEGER NOT NULL DEFAULT 0',
        effects: 'JSONB DEFAULT \'[]\'::jsonb',
        requirements: 'JSONB DEFAULT \'[]\'::jsonb',
        metadata: 'JSONB DEFAULT \'{}\'::jsonb',
        is_active: 'BOOLEAN DEFAULT true',
        created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
      }
    },

    user_inventory: {
      description: 'Junction table for user-item relationships',
      fields: {
        user_id: 'UUID REFERENCES public.profiles(id)',
        item_id: 'TEXT REFERENCES public.items(id)',
        quantity: 'INTEGER DEFAULT 1',
        equipped: 'BOOLEAN DEFAULT false',
        acquired_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP',
        PRIMARY_KEY: '(user_id, item_id)'
      }
    },

    daily_rewards: {
      description: 'Daily reward definitions',
      fields: {
        id: 'TEXT PRIMARY KEY',
        day: 'INTEGER NOT NULL',
        reward_type: 'TEXT NOT NULL',
        reward_value: 'INTEGER NOT NULL',
        rarity: 'TEXT NOT NULL',
        created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
      }
    },

    user_daily_rewards: {
      description: 'Junction table for user-daily reward claims',
      fields: {
        user_id: 'UUID REFERENCES public.profiles(id)',
        reward_id: 'TEXT REFERENCES public.daily_rewards(id)',
        claimed_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP',
        PRIMARY_KEY: '(user_id, reward_id)'
      }
    },

    battle_stats: {
      description: 'User battle statistics',
      fields: {
        user_id: 'UUID REFERENCES public.profiles(id)',
        total_battles: 'INTEGER DEFAULT 0',
        wins: 'INTEGER DEFAULT 0',
        losses: 'INTEGER DEFAULT 0',
        win_streak: 'INTEGER DEFAULT 0',
        highest_streak: 'INTEGER DEFAULT 0',
        total_xp_earned: 'INTEGER DEFAULT 0',
        total_coins_earned: 'INTEGER DEFAULT 0',
        updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP',
        PRIMARY_KEY: '(user_id)'
      }
    },

    user_logins: {
      description: 'User login history for streak tracking',
      fields: {
        id: 'UUID DEFAULT uuid_generate_v4() PRIMARY KEY',
        user_id: 'UUID REFERENCES public.profiles(id)',
        login_date: 'DATE NOT NULL',
        streak_maintained: 'BOOLEAN DEFAULT false',
        created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
      }
    }
  },

  indexes: [
    'CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id)',
    'CREATE INDEX idx_user_quests_user_id ON public.user_quests(user_id)',
    'CREATE INDEX idx_user_inventory_user_id ON public.user_inventory(user_id)',
    'CREATE INDEX idx_user_daily_rewards_user_id ON public.user_daily_rewards(user_id)',
    'CREATE INDEX idx_user_logins_user_id ON public.user_logins(user_id)',
    'CREATE INDEX idx_battle_stats_user_id ON public.battle_stats(user_id)'
  ],

  triggers: [
    {
      name: 'update_updated_at_column',
      description: 'Updates updated_at timestamp on row update',
      tables: ['profiles', 'achievements', 'quests', 'items']
    }
  ],

  policies: {
    description: 'Row Level Security (RLS) policies',
    default: [
      'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE public.items ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE public.user_daily_rewards ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE public.battle_stats ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE public.user_logins ENABLE ROW LEVEL SECURITY'
    ]
  }
}; 