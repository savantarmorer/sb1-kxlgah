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
      // First check if we have an existing service worker
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      // If we have an existing service worker, check if it needs updating
      if (registrations.length > 0) {
        for (const registration of registrations) {
          if (registration.waiting) {
            // New version waiting to activate
            console.log('New service worker waiting to activate');
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          } else {
            // Check for updates
            await registration.update();
          }
        }
      } else {
        // No existing service worker, register a new one
        const registration = await navigator.serviceWorker.register('/sw.js', { 
          scope: '/',
          updateViaCache: 'none' // Always check for updates
        });
        
        console.log('ServiceWorker registration successful:', registration);
      }

      // Listen for the controlling service worker changing
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('New service worker activated');
        // Reload the page to ensure new service worker takes control
        window.location.reload();
      });

      // Listen for messages from the service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('New content is available; please refresh.');
          // You could show a notification to the user here
        }
      });

    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  });

  // Handle service worker updates
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
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


