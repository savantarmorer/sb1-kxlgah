import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { GameProvider } from './contexts/GameContext';
import { BattleProvider } from './contexts/BattleContext';
import { AdminProvider } from './contexts/AdminContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <GameProvider>
                <BattleProvider>
                  <AdminProvider>
                    <NotificationProvider>
                      <App />
                    </NotificationProvider>
                  </AdminProvider>
                </BattleProvider>
              </GameProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

/**
 * Provider Order:
 * 1. ErrorBoundary - Catches all errors
 * 2. ThemeProvider - Theme context
 * 3. LanguageProvider - i18n
 * 4. AuthProvider - Authentication
 * 5. GameProvider - Game state
 * 6. BattleProvider - Battle state
 * 7. AdminProvider - Admin features
 * 8. NotificationProvider - Notifications
 * 
 * Dependencies:
 * - All context providers
 * - ErrorBoundary for error handling
 * - Global styles
 * 
 * Used by:
 * - Root application mount
 * 
 * Features:
 * - Complete provider tree
 * - Error handling
 * - Type safety
 * - Battle system integration
 * 
 * Scalability:
 * - Easy to add new providers
 * - Clear dependency order
 * - Proper context isolation
 */


