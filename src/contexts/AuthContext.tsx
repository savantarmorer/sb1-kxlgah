import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.ts';
import { User } from '../types/user';

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

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as Error };
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
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        setIsAdmin(false);
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
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
        setUser(null);
        setIsAdmin(false);
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