import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import { GameProvider } from './contexts/GameContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import App from './App';
import './index.css';

// Unregister any existing service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <GameProvider>
            <NotificationProvider>
              <AdminProvider>
                <App />
              </AdminProvider>
            </NotificationProvider>
          </GameProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  </React.StrictMode>
);


