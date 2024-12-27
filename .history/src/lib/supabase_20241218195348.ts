import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvmjnkdgiuwutobtqprh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2bWpua2RnaXV3dXRvYnRxcHJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0Mzk0MTEsImV4cCI6MjA0NzAxNTQxMX0.OoHtnkZajEJvqN5CLQhFOnAYQ1S33WJZK8mw6NOL84I';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mock data for development
export const mockData = {
  profiles: [],
  achievements: [],
  quests: [],
  items: [],
  statistics: []
};

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

// Test connection and log status in development
if (process.env.NODE_ENV === 'development') {
  testConnection().catch(console.error);
}

async function testConnection() {
  try {
    const { error } = await supabase.from('profiles').select('count');
    if (error) throw error;
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
}