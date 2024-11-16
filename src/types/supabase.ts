import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'cepac-auth-token',
  }}
// Auth helpers
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });
  return { data, error };
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
