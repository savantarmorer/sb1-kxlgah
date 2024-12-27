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
  const registerServiceWorker = async () => {
    try {
      // First check if we have an existing service worker
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      // If we have an existing service worker, check if it needs updating
      if (registrations.length > 0) {
        for (const reg of registrations) {
          if (reg.waiting) {
            // New version waiting to activate
            console.log('New service worker waiting to activate');
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          } else {
            // Check for updates
            await reg.update();
          }
        }
      } else {
        // No existing service worker, register a new one
        await navigator.serviceWorker.register('/sw.js', { 
          scope: '/',
          updateViaCache: 'none'
        });
        console.log('ServiceWorker registration successful');
      }

      // Only reload if there's a genuine update
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', async () => {
        if (!refreshing && navigator.serviceWorker.controller?.state === 'activated') {
          refreshing = true;
          const registration = await navigator.serviceWorker.ready;
          if (registration.waiting) {
            if (confirm('New version available. Reload to update?')) {
              window.location.reload();
            }
          }
        }
      });

    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  };

  // Register service worker after the app is mounted
  window.addEventListener('load', () => {
    setTimeout(registerServiceWorker, 1000);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <ColorModeProvider>
        <AuthProvider>
          <NotificationProvider>
            <GameProvider>
              <AdminProvider>
                <App />
              </AdminProvider>
            </GameProvider>
          </NotificationProvider>
        </AuthProvider>
      </ColorModeProvider>
    </Router>
  </React.StrictMode>
);


