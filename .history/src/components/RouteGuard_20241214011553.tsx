import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

export const RouteGuard: React.FC = ({ children }) => {
  const { user, loading } = useAuth();

  console.log('RouteGuard:', { user, loading });

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    // Redirect to login or show authentication form
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};