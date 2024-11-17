import { createClient } from '@supabase/supabase-js';
<<<<<<< HEAD
import type { Database } from '../types/supabase';
import { Achievement } from '../types/achievements';
import { InventoryItem } from '../types';
import { convertToJson, convertFromJson } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
=======
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

<<<<<<< HEAD
const formattedUrl = supabaseUrl.startsWith('http') 
  ? supabaseUrl 
  : `https://${supabaseUrl}`;

export const supabase = createClient<Database>(formattedUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

interface UserProgress {
  xp: number;
  level: number;
  coins: number;
  streak: number;
  achievements: any[];
  inventory: any[];
}

// Mock implementation for development
export async function getUserProgress(userId: string) {
  const savedProgress = localStorage.getItem(`user_progress_${userId}`);
  return {
    data: savedProgress ? JSON.parse(savedProgress) : null,
    error: null
  };
}

export async function updateUserProgress(userId: string, data: Partial<UserProgress>) {
  localStorage.setItem(`user_progress_${userId}`, JSON.stringify(data));
  return {
    data: null,
    error: null
  };
}

export async function createUserProgress(userId: string) {
  return await supabase
    .from('user_progress')
    .insert([
      {
        user_id: userId,
        xp: 0,
        level: 1,
        coins: 100,
        streak: 0,
        achievements: [],
        inventory: []
      }
    ]);
}

console.log('Supabase client initialized with URL:', formattedUrl);
=======
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

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

// Aqui está a função que faltava
export const initializeUserProgress = async (userId: string) => {
  // Primeiro verifica se já existe
  const { data: existingProgress } = await getUserProgress(userId);
  
  // Se já existe, retorna sem fazer nada
  if (existingProgress) {
    return { data: existingProgress, error: null };
  }

  // Se não existe, cria novo progresso
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
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
