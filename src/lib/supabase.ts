import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { Achievement } from '../types/achievements';
import { InventoryItem } from '../types';
import { convertToJson, convertFromJson } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

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