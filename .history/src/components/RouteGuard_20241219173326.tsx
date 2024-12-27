import React, { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

export const RouteGuard: React.FC<PropsWithChildren> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    // Redirect to login or show authentication form
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};