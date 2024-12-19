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

          // Update game state with auth user
          if (session?.user) {
            dispatch({
              type: 'SET_USER',
              payload: {
                id: session.user.id,
                email: session.user.email,
                // Add other user properties as needed
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

          // Update game state when auth state changes
          if (session?.user) {
            dispatch({
              type: 'SET_USER',
              payload: {
                id: session.user.id,
                email: session.user.email,
                // Add other user properties as needed
              }
            });
          } else {
            // Clear game state when user logs out
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