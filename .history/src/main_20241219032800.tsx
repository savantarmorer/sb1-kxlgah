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

// Only register ServiceWorker in production
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // First unregister any existing ServiceWorker
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
      
      // Then register the new ServiceWorker
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(registration => {
          console.log('ServiceWorker registration successful:', registration);
        })
        .catch(error => {
          console.error('ServiceWorker registration failed:', error);
        });
    });
  });
} else if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // In development, unregister any existing ServiceWorker
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('ServiceWorker unregistered in development mode');
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


