import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { CssBaseline } from '@mui/material';
import { useColorMode } from './contexts/ColorModeContext';
import { lightTheme, darkTheme } from './theme/theme';
import LoadingScreen from './components/LoadingScreen';
import { RouteGuard } from './components/RouteGuard';
import AppContent from './components/AppContent';
import ShopSystem from './components/Shop/ShopSystem';
import { InventoryPage } from './routes/InventoryPage';
import AuthForm from './components/Auth/AuthForm';
import NotificationHandler from './components/notifications/NotificationHandler';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TournamentLobby } from './components/Tournament/TournamentLobby';
import { TournamentView } from './components/Tournament/TournamentView';
import { useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SoundProvider } from './contexts/SoundContext';
import { TournamentProvider } from './contexts/TournamentContext';
import { SnackbarProvider } from 'notistack';

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
        <LanguageProvider>
          <SoundProvider>
            <TournamentProvider>
              <SnackbarProvider 
                maxSnack={3} 
                anchorOrigin={{ 
                  vertical: 'bottom', 
                  horizontal: 'right' 
                }}
              >
                {children}
              </SnackbarProvider>
            </TournamentProvider>
          </SoundProvider>
        </LanguageProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

function AppRoutes() {
  const { user, isLoading, initialized } = useAuth();

  if (isLoading || !initialized) {
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
        <NotificationHandler />
        <AppRoutes />
      </AppWithProviders>
    </ErrorBoundary>
  );
}

export default App;