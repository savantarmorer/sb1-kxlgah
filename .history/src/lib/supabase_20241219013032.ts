import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Test connection and log status in development
if (process.env.NODE_ENV === 'development') {
  testConnection().catch(console.error);
}

async function testConnection() {
  try {
    const { error } = await supabase.from('profiles').select('count');
    if (error) throw error;
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}

// Helper function to get data with fallback to mock data
export async function getData(table: string) {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(10);

    if (error) throw error;
    return data;
  } catch (error) {
    console.warn(`Using mock data for ${table}:`, error);
    return mockData[table as keyof typeof mockData] || [];
  }
}

// Mock data for development
export const mockData = {
  profiles: [],
  achievements: [],
  quests: [],
  items: [],
  statistics: []
};