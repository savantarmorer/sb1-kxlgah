import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.ts';
import { User } from '../types/user';
import { useGame } from './GameContext';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  initialized: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { dispatch } = useGame();

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setIsAdmin(profile?.is_super_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (!mounted) return;
      
      try {
        setIsLoading(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) throw profileError;

          if (profile && mounted) {
            setUser(profile);
            await checkAdminStatus(profile.id);

            // Initialize game state with user profile
            dispatch({
              type: 'SET_USER',
              payload: profile
            });
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        setIsAdmin(false);
        dispatch({ type: 'RESET_GAME_STATE' });
      } finally {
        if (mounted) {
          setIsLoading(false);
          setInitialized(true);
        }
      }
    };

    // Initialize auth immediately
    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      setIsLoading(true);
      
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) throw profileError;

          if (profile && mounted) {
            setUser(profile);
            await checkAdminStatus(profile.id);

            // Update game state with user profile
            dispatch({
              type: 'SET_USER',
              payload: profile
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAdmin(false);
          dispatch({ type: 'RESET_GAME_STATE' });
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
        setUser(null);
        setIsAdmin(false);
        dispatch({ type: 'RESET_GAME_STATE' });
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [dispatch]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({ email, password });

      if (!error) {
        // Create initial profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: (await supabase.auth.getUser()).data.user?.id,
              email,
              name: email.split('@')[0],
              level: 1,
              xp: 0,
              coins: 0,
              streak: 0,
              battle_rating: 0
            }
          ]);

        if (profileError) {
          console.error('Error creating profile:', profileError);
          return { error: new Error('Failed to create user profile') };
        }
      }

      return { error };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render children until initial auth check is complete
  if (!initialized) {
    return null;
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      initialized,
      isAdmin,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}