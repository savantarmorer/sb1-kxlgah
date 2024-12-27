import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ColorModeProvider } from './contexts/ColorModeContext';
import { GameProvider } from './contexts/GameContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import App from './App';
import './index.css';

// Unregister any existing ServiceWorker and register the new one
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
    });
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(registration => {
        console.log('ServiceWorker registered:', registration);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <ColorModeProvider>
        <AuthProvider>
          <GameProvider>
            <AdminProvider>
              <NotificationProvider>
                <App />
              </NotificationProvider>
            </AdminProvider>
          </GameProvider>
        </AuthProvider>
      </ColorModeProvider>
    </Router>
  </React.StrictMode>
);


