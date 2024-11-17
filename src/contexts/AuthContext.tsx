<<<<<<< HEAD
import React, { createContext, useContext, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}
=======
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase, initializeUserProgress } from '../lib/supabase';
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d

interface AuthContextType {
  user: User | null;
  loading: boolean;
<<<<<<< HEAD
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
=======
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
<<<<<<< HEAD
  const [loading, setLoading] = useState(false);

  // Temporary auth functions for development
 // Update the signIn function to properly set admin role
const signIn = async (email: string, password: string) => {
  setLoading(true);
  try {
    // For development, grant admin access if email contains "admin"
    const isAdmin = email.toLowerCase().includes('admin');
    
    setUser({
      id: '1',
      email,
      name: isAdmin ? 'Admin User' : 'Test User',
      roles: isAdmin ? ['admin', 'user'] : ['user']
    });
    
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  } finally {
    setLoading(false);
  }
};
      

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const isAdmin = email.toLowerCase().includes('admin');
      
      setUser({
        id: '1',
        email,
        name: isAdmin ? 'Admin User' : 'Test User',
        roles: isAdmin ? ['admin', 'user'] : ['user']
      });
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
=======
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Processa o hash da URL se existir
    const processHashParams = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        // Remove o hash da URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Força uma verificação de sessão
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          try {
            await initializeUserProgress(session.user.id);
          } catch (error) {
            console.error('Erro ao inicializar usuário após hash:', error);
          }
        }
      }
    };

    // Função para inicializar usuário
    const initializeUser = async (userId: string) => {
      try {
        await initializeUserProgress(userId);
      } catch (error) {
        console.error('Erro ao inicializar usuário:', error);
      }
    };

    // Verificar sessão inicial
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await initializeUser(session.user.id);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      } finally {
        setLoading(false);
      }
    };

    // Executa verificações iniciais
    processHashParams().then(() => checkSession());

    // Ouvir mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, 'Session:', session); // Debug

      if (session?.user) {
        setUser(session.user);
        if (event === 'SIGNED_IN') {
          try {
            await initializeUser(session.user.id);
          } catch (error) {
            console.error('Erro ao inicializar usuário após auth change:', error);
          }
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`, // Removido /auth/callback
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erro no login com Google:', error);
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      console.error('Erro no login com email:', error);
      return { error: error as AuthError };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      return { error };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return { error: error as AuthError };
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
    }
  };

  const signOut = async () => {
<<<<<<< HEAD
    setLoading(true);
    try {
      setUser(null);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut
      }}
    >
      {children}
=======
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        setUser(null);
      }
      return { error };
    } catch (error) {
      console.error('Erro no logout:', error);
      return { error: error as AuthError };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
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
