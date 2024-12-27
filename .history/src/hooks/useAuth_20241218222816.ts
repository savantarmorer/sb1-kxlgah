import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    // Get initial session
    const session = supabase.auth.getSession();
    setState(prev => ({
      ...prev,
      user: session?.user ?? null,
      isLoading: false
    }));

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setState(prev => ({
          ...prev,
          user: session?.user ?? null,
          isLoading: false
        }));
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to sign in'
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to sign out'
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return {
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,
    signIn,
    signOut
  };
} 