import { createClient } from '@supabase/supabase-js';

const mockSupabaseClient = {
  auth: {
    getSession: jest.fn().mockResolvedValue(null),
    onAuthStateChange: jest.fn(),
    signOut: jest.fn()
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis()
  }))
};

export const supabase = mockSupabaseClient;
export default mockSupabaseClient; 