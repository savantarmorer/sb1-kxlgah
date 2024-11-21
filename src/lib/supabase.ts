import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL');
}

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY');
}

// Add debug logging in development
if (import.meta.env.DEV) {
  console.log('Supabase Configuration:', {
    url: import.meta.env.VITE_SUPABASE_URL,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 10) + '...',
    mode: import.meta.env.MODE
  });
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Test connection
testConnection().then(isConnected => {
  if (!isConnected) {
    console.error('Failed to connect to Supabase');
  }
});

async function testConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('count');
    if (error) {
      throw error;
    }
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
}

// Add error logging
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  } else if (event === 'SIGNED_IN') {
    console.log('User signed in:', session?.user?.email);
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed');
  } else if (event === 'USER_UPDATED') {
    console.log('User updated');
  }
});

// Mock data for development
export const mockData = {
  profiles: [],
  achievements: [],
  quests: [],
  items: []
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

// Export mock questions for battle system
export const mockQuestions = [
  {
    id: '1',
    question: 'What is the primary purpose of constitutional law?',
    answers: [
      'To regulate business practices',
      'To establish fundamental rights and government structure',
      'To handle criminal cases',
      'To resolve civil disputes'
    ],
    correctAnswer: 1,
    category: 'constitutional',
    difficulty: 1
  },
  {
    id: '2',
    question: 'Which principle is central to the rule of law?',
    answers: [
      'Equality before the law',
      'Mandatory legal representation',
      'Jury trials only',
      'Verbal agreements'
    ],
    correctAnswer: 0,
    category: 'general',
    difficulty: 1
  },
  {
    id: '3',
    question: 'What is habeas corpus?',
    answers: [
      'A type of criminal charge',
      'A legal document for property transfer',
      'A writ requiring a person to be brought before a judge',
      'A marriage certificate'
    ],
    correctAnswer: 2,
    category: 'constitutional',
    difficulty: 2
  }
];