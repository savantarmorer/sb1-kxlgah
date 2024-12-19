import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ColorModeProvider, useColorMode } from './contexts/ColorModeContext';
import { lightTheme, darkTheme } from './theme/theme';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SoundProvider } from './contexts/SoundContext';
import { TournamentProvider } from './contexts/TournamentContext';
import { AdminProvider } from './contexts/AdminContext';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import LoadingScreen from './components/LoadingScreen';
import { RouteGuard } from './components/RouteGuard';
import AppContent from './components/AppContent';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppWithProviders({ children }: { children: React.ReactNode }) {
  const { mode } = useColorMode();
  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <AuthProvider>
          <GameProvider>
            <AdminProvider>
              <LanguageProvider>
                <NotificationProvider>
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

function App() {
  return (
    <ErrorBoundary>
      <ColorModeProvider>
        <AppWithProviders>
          <AppContent />
        </AppWithProviders>
      </ColorModeProvider>
    </ErrorBoundary>
  );
}

export default App;