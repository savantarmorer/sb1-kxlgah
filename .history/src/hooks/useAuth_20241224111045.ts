import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

interface User {
  id: string;
  name: string;
  avatar_url?: string;
  battleStats?: {
    wins: number;
  };
  battleRatings?: {
    rating: number;
  };
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 