import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase.ts';
import { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  initialized: boolean;
  isAdmin: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom event for auth state changes
export const AUTH_STATE_CHANGE = 'AUTH_STATE_CHANGE';
export const emitAuthStateChange = (user: User | null) => {
  window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGE, { detail: user }));
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const fetchUserProfile = async (userId: string) => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;
    return profile;
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (!mounted) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);

          if (profile && mounted) {
            setUser(profile);
            await checkAdminStatus(profile.id);
            emitAuthStateChange(profile);
          }
        } else {
          emitAuthStateChange(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        setIsAdmin(false);
        setError(error instanceof Error ? error.message : 'Failed to initialize auth');
        emitAuthStateChange(null);
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
      setError(null);
      
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchUserProfile(session.user.id);

          if (profile && mounted) {
            setUser(profile);
            await checkAdminStatus(profile.id);
            emitAuthStateChange(profile);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAdmin(false);
          emitAuthStateChange(null);
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
        setUser(null);
        setIsAdmin(false);
        setError(error instanceof Error ? error.message : 'Failed to handle auth change');
        emitAuthStateChange(null);
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
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;

      // Get the current session after sign in
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (session?.user) {
        // Fetch complete user profile
        const profile = await fetchUserProfile(session.user.id);
        if (profile) {
          setUser(profile);
          await checkAdminStatus(profile.id);
          emitAuthStateChange(profile);
        }
      }

      return { error: null };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sign in');
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const { data: authData, error } = await supabase.auth.signUp({ email, password });

      if (error) throw error;
      if (!authData.user) throw new Error('No user data returned from signup');

      // Create initial profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
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
        throw new Error('Failed to create user profile');
      }

      return { error: null };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sign up');
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sign out');
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
      error,
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