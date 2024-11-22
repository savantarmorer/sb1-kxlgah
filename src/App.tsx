import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppContent from './components/AppContent';
import LoadingScreen from './components/LoadingScreen';
import AuthForm from './components/Auth/AuthForm';
import { RouteGuard } from './components/RouteGuard';
import { SoundProvider } from './contexts/SoundContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { BattleProvider } from './contexts/BattleContext';
import { AdminProvider } from './contexts/AdminContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ErrorBoundary from './components/ErrorBoundary';

function AppRoutes() {
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

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            <GameProvider>
              <BattleProvider>
                <AdminProvider>
                  <NotificationProvider>
                    <SoundProvider>
                      <AppRoutes />
                    </SoundProvider>
                  </NotificationProvider>
                </AdminProvider>
              </BattleProvider>
            </GameProvider>
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;