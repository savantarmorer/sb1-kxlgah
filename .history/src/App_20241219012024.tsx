import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SoundProvider } from './contexts/SoundContext';
import { TournamentProvider } from './contexts/TournamentContext';
import { AdminProvider } from './contexts/AdminContext';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from './theme/theme';
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
import { useColorMode } from './contexts/ColorModeContext';

function AppWithProviders({ children }: { children: React.ReactNode }) {
  const { mode } = useColorMode();
  const theme = React.useMemo(
    () => mode === 'dark' ? darkTheme : lightTheme,
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <AuthProvider>
          <GameProvider>
            <AdminProvider>
              <LanguageProvider>
                <NotificationProvider>
                  <NotificationHandler />
                  <SoundProvider>
                    <TournamentProvider>
                      {children}
                    </TournamentProvider>
                  </SoundProvider>
                </NotificationProvider>
              </LanguageProvider>
            </AdminProvider>
          </GameProvider>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

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
            </Routes>
          </RouteGuard>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppWithProviders>
        <AppRoutes />
      </AppWithProviders>
    </ErrorBoundary>
  );
}

export default App;