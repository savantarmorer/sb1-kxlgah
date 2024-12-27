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

// Register ServiceWorker in both development and production
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // First unregister any existing ServiceWorker to ensure clean state
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
      
      // Then register the new ServiceWorker
      const registration = await navigator.serviceWorker.register('/sw.js', { 
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });
      
      console.log('ServiceWorker registration successful:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, notify user
              console.log('New content is available; please refresh.');
            }
          });
        }
      });
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <ColorModeProvider>
        <NotificationProvider>
          <AuthProvider>
            <AdminProvider>
              <GameProvider>
                <App />
              </GameProvider>
            </AdminProvider>
          </AuthProvider>
        </NotificationProvider>
      </ColorModeProvider>
    </Router>
  </React.StrictMode>
);


