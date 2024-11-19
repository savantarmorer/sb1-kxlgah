import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<User>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace('/');
      } else if (session?.user) {
        await setUserData(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await setUserData(session.user);
      }
    } catch (error) {
      console.error('Error checking user session:', error);
    } finally {
      setLoading(false);
    }
  }

  const setUserData = async (supabaseUser: SupabaseUser) => {
    try {
      const isAdminEmail = supabaseUser.email === 'admin@admin';
      console.log('Setting user data for:', supabaseUser.email);
      console.log('Is admin email?', isAdminEmail);

      if (isAdminEmail) {
        console.log('Attempting to set admin privileges');
        const { data: adminProfile, error: adminError } = await supabase
          .from('profiles')
          .upsert({
            id: supabaseUser.id,
            name: 'Admin',
            is_super_admin: true,
            level: 99,
            xp: 10000,
            coins: 999999,
            streak: 0,
            study_time: 0,
            constitutional_score: 100,
            civil_score: 100,
            criminal_score: 100,
            administrative_score: 100,
            updated_at: new Date().toISOString()
          })
          .select('*')
          .single();

        console.log('Admin profile upsert result:', { adminProfile, adminError });

        if (!adminError && adminProfile) {
          const userData = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: adminProfile.name,
            roles: ['admin', 'user', 'premium'],
            level: adminProfile.level,
            xp: adminProfile.xp,
            coins: adminProfile.coins,
            streak: adminProfile.streak,
            studyTime: adminProfile.study_time,
            constitutionalScore: adminProfile.constitutional_score,
            civilScore: adminProfile.civil_score,
            criminalScore: adminProfile.criminal_score,
            administrativeScore: adminProfile.administrative_score
          };
          console.log('Setting admin user data:', userData);
          setUser(userData);
          return;
        }
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                id: supabaseUser.id,
                name: supabaseUser.user_metadata.name || supabaseUser.email?.split('@')[0],
                is_super_admin: isAdminEmail,
                level: isAdminEmail ? 99 : 1,
                xp: isAdminEmail ? 10000 : 0,
                coins: isAdminEmail ? 999999 : 100,
                streak: 0,
                study_time: 0,
                constitutional_score: isAdminEmail ? 100 : 0,
                civil_score: isAdminEmail ? 100 : 0,
                criminal_score: isAdminEmail ? 100 : 0,
                administrative_score: isAdminEmail ? 100 : 0
              }
            ])
            .select()
            .single();

          if (createError) throw createError;
          if (newProfile) {
            setUser({
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              name: newProfile.name,
              roles: isAdminEmail ? ['admin', 'user', 'premium'] : ['user']
            });
            return;
          }
        }
        throw error;
      }

      if (profile) {
        if (isAdminEmail && !profile.is_super_admin) {
          await supabase
            .from('profiles')
            .update({
              is_super_admin: true,
              level: 99,
              xp: 10000,
              coins: 999999
            })
            .eq('id', supabaseUser.id);
        }

        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: profile.name,
          roles: isAdminEmail ? ['admin', 'user', 'premium'] : (profile.is_super_admin ? ['admin', 'user'] : ['user'])
        });

        console.log('User data set:', {
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: profile.name,
          roles: isAdminEmail ? ['admin', 'user', 'premium'] : (profile.is_super_admin ? ['admin', 'user'] : ['user']),
          is_super_admin: profile.is_super_admin
        });
      }
    } catch (error) {
      console.error('Error in setUserData:', error);
      if (supabaseUser.email === 'admin@admin') {
        const userData = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: 'Admin',
          roles: ['admin', 'user', 'premium']
        };
        console.log('Fallback: Setting admin user data:', userData);
        setUser(userData);
      } else {
        setUser(null);
      }
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setUser(prev => prev ? { ...prev, ...updates } : null);
      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!newUser) throw new Error('User creation failed');

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: newUser.id,
            name,
            roles: ['user'],
            level: 1,
            xp: 0,
            coins: 100,
            streak: 0,
            study_time: 0,
            constitutional_score: 0,
            civil_score: 0,
            criminal_score: 0,
            administrative_score: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (profileError) {
        console.error('Error creating profile:', profileError);
        await supabase.auth.admin.deleteUser(newUser.id);
        throw new Error('Profile creation failed');
      }

      return { error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();

      const { error } = await supabase.auth.signOut({
        scope: 'global'
      });
      
      if (error) throw error;

      setUser(null);

      window.location.replace('/');

      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile
      }}
    >
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
