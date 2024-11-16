import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase, initializeUserProgress } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica hash da URL para auth com OAuth
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    if (accessToken) {
      window.location.hash = '';
    }

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      
      // Inicializa progresso do usuário se necessário
      if (newUser) {
        initializeUserProgress(newUser.id).catch(console.error);
      }
      
      setLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);

      // Inicializa progresso para novos usuários
      if (newUser && _event === 'SIGNED_IN') {
        try {
          await initializeUserProgress(newUser.id);
        } catch (error) {
          console.error('Erro ao inicializar progresso:', error);
        }
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
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (!error) {
        // Opcional: adicione lógica adicional após login bem-sucedido
        console.log('Login com Google iniciado');
      }

      return { error };
    } catch (error) {
      console.error('Erro no login com Google:', error);
      return { error: error as AuthError };
    }
  };

  const value = {
    user,
    loading,
    signIn: async (email: string, password: string) => {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
      } catch (error) {
        console.error('Erro no login:', error);
        return { error: error as AuthError };
      }
    },
    signUp: async (email: string, password: string) => {
      try {
        const { error } = await supabase.auth.signUp({ email, password });
        return { error };
      } catch (error) {
        console.error('Erro no cadastro:', error);
        return { error: error as AuthError };
      }
    },
    signOut: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        return { error };
      } catch (error) {
        console.error('Erro no logout:', error);
        return { error: error as AuthError };
      }
    },
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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
