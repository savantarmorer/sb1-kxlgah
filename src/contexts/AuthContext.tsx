import React, { createContext, useContext, useState } from 'react';

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
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
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
    }
  };

  const signOut = async () => {
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
