import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppContent from './components/AppContent';
import LoadingScreen from './components/LoadingScreen';
import AuthForm from './components/Auth/AuthForm';
import { RouteGuard } from './components/RouteGuard';

function App() {
  const { user, loading, initialized } = useAuth();

  if (loading || !initialized) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          !user ? <AuthForm /> : <Navigate to="/home" replace />
        } 
      />
      <Route 
        path="/home/*" 
        element={
          <RouteGuard>
            <AppContent />
          </RouteGuard>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;