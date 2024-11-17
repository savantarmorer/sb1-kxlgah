<<<<<<< HEAD
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      quests: {
        Row: {
          id: string;
          title: string;
          description: string;
          type: string;
          xp_reward: number;
          coin_reward: number;
          deadline: string;
          progress: number;
          requirements: Json[];
          lootbox?: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['quests']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['quests']['Row']>;
      };
      items: {
        Row: {
          id: string;
          name: string;
          description: string;
          type: string;
          rarity: string;
          cost: number;
          effects: Json[];
          requirements: Json[];
          metadata: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['items']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['items']['Row']>;
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          roles: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };
    }
  }
}

export const convertToJson = <T>(data: T): Json => {
  return JSON.parse(JSON.stringify(data));
};

export const convertFromJson = <T>(json: Json): T => {
  return json as T;
};
=======
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'cepac-auth-token',
    storage: window.localStorage
  },
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auth helpers permanece igual, mas atualize o signInWithGoogle:
export const signInWithGoogle = async () => {
  try {
    // Força logout antes do novo login
    await supabase.auth.signOut();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    return { data, error };
  } catch (error) {
    console.error('Erro no login com Google:', error);
    return { data: null, error };
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Real-time subscriptions
export const subscribeToUserProgress = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('user_progress')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_progress',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
};

// Database operations
export const updateUserProgress = async (userId: string, data: Partial<Database['public']['Tables']['user_progress']['Update']>) => {
  const { data: result, error } = await supabase
    .from('user_progress')
    .upsert({ 
      user_id: userId,
      ...data,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  return { data: result, error };
};

export const getUserProgress = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  return { data, error };
};

// Inicialização do progresso do usuário
export const initializeUserProgress = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_progress')
    .insert({
      user_id: userId,
      xp: 0,
      level: 1,
      coins: 0,
      streak: 0,
      achievements: [],
      inventory: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  return { data, error };
};

// Funções auxiliares para achievements
export const addAchievement = async (userId: string, achievement: any) => {
  const { data: currentProgress } = await getUserProgress(userId);
  
  if (currentProgress) {
    const updatedAchievements = [...(currentProgress.achievements as any[]), achievement];
    return updateUserProgress(userId, { achievements: updatedAchievements });
  }
  
  return { data: null, error: new Error('User progress not found') };
};

// Funções auxiliares para inventory
export const addToInventory = async (userId: string, item: any) => {
  const { data: currentProgress } = await getUserProgress(userId);
  
  if (currentProgress) {
    const updatedInventory = [...(currentProgress.inventory as any[]), item];
    return updateUserProgress(userId, { inventory: updatedInventory });
  }
  
  return { data: null, error: new Error('User progress not found') };
};

// XP e Level helpers
export const addXP = async (userId: string, amount: number) => {
  const { data: currentProgress } = await getUserProgress(userId);
  
  if (currentProgress) {
    const newXP = (currentProgress.xp || 0) + amount;
    const currentLevel = currentProgress.level || 1;
    const xpForNextLevel = currentLevel * 1000; // Exemplo: cada nível requer level * 1000 XP
    
    let newLevel = currentLevel;
    if (newXP >= xpForNextLevel) {
      newLevel = Math.floor(newXP / 1000) + 1;
    }
    
    return updateUserProgress(userId, { 
      xp: newXP,
      level: newLevel
    });
  }
  
  return { data: null, error: new Error('User progress not found') };
};

// Streak helpers
export const updateStreak = async (userId: string) => {
  const { data: currentProgress } = await getUserProgress(userId);
  
  if (currentProgress) {
    const lastUpdate = new Date(currentProgress.updated_at);
    const now = new Date();
    const daysSinceLastUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
    
    let newStreak = currentProgress.streak || 0;
    if (daysSinceLastUpdate === 1) {
      newStreak += 1;
    } else if (daysSinceLastUpdate > 1) {
      newStreak = 0;
    }
    
    return updateUserProgress(userId, { streak: newStreak });
  }
  
  return { data: null, error: new Error('User progress not found') };
};
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
