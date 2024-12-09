import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SoundProvider } from './contexts/SoundContext';
import { TournamentProvider } from './contexts/TournamentContext';
import { AdminProvider } from './contexts/AdminContext';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { muiTheme } from './theme/mui';
import LoadingScreen from './components/LoadingScreen';
import { RouteGuard } from './components/RouteGuard';
import AppContent from './components/AppContent';
import ShopSystem from './components/Shop/ShopSystem';
import { InventoryPage } from './routes/InventoryPage';
import AuthForm from './components/Auth/AuthForm';
import NotificationHandler from './components/notifications/NotificationHandler';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TournamentLobby } from '@/components/Tournament/TournamentLobby';
import { TournamentView } from '@/components/Tournament/TournamentView';

function AppRoutes() {
  const { user, loading, initialized } = useAuth();

  if (loading || !initialized) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={!user ? <AuthForm /> : <Navigate to="/home" replace />} 
      />
      <Route 
        path="/*" 
        element={
          <RouteGuard>
            <Routes>
              <Route path="/home/*" element={<AppContent />} />
              <Route path="/shop" element={<ShopSystem />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/tournament" element={<TournamentLobby />} />
              <Route path="/tournament/:id" element={<TournamentView />} />
              {/* other routes */}
            </Routes>
          </RouteGuard>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <ErrorBoundary>
        <AuthProvider>
          <GameProvider>
            <ThemeProvider>
              <MUIThemeProvider theme={muiTheme}>
                <LanguageProvider>
                  <NotificationProvider>
                    <NotificationHandler />
                    <SoundProvider>
                      <TournamentProvider>
                        <AdminProvider>
                          <AppRoutes />
                        </AdminProvider>
                      </TournamentProvider>
                    </SoundProvider>
                  </NotificationProvider>
                </LanguageProvider>
              </MUIThemeProvider>
            </ThemeProvider>
          </GameProvider>
        </AuthProvider>
      </ErrorBoundary>
    </LocalizationProvider>
  );
}

export default App;