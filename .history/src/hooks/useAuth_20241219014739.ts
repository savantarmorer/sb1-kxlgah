import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useGame } from '../contexts/GameContext';

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
  const { dispatch } = useGame();

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted) {
          setState(prev => ({
            ...prev,
            user: session?.user ?? null,
            isLoading: false
          }));

          // If user is logged in, fetch their profile and initialize game state
          if (session?.user) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) throw profileError;

            // Initialize game state with user profile
            dispatch({
              type: 'SET_USER',
              payload: {
                id: session.user.id,
                email: session.user.email,
                ...profile
              }
            });
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setState(prev => ({
            ...prev,
            user: null,
            error: error instanceof Error ? error.message : 'Failed to initialize auth',
            isLoading: false
          }));
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setState(prev => ({
            ...prev,
            user: session?.user ?? null,
            isLoading: false,
            error: null
          }));

          if (event === 'SIGNED_IN' && session?.user) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) throw profileError;

            // Update game state with user profile
            dispatch({
              type: 'SET_USER',
              payload: {
                id: session.user.id,
                email: session.user.email,
                ...profile
              }
            });
          } else if (event === 'SIGNED_OUT') {
            // Reset game state on sign out
            dispatch({ type: 'RESET_GAME_STATE' });
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [dispatch]);

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
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Reset game state on sign out
      dispatch({ type: 'RESET_GAME_STATE' });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to sign out'
      }));
      throw error;
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