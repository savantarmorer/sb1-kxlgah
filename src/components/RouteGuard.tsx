import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuth();
  const location = useLocation();

  if (loading || !initialized) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
} 