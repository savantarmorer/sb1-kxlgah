import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
<<<<<<< HEAD
=======
import { GameProvider } from './contexts/GameContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

<<<<<<< HEAD
try {
  // Add dark mode class if previously saved
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }

  const rootElement = createRoot(root);
  rootElement.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  // Show a basic error message to the user
  root.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h1>Something went wrong</h1>
      <p>Please try refreshing the page</p>
      <pre style="color: red;">${error instanceof Error ? error.message : 'Unknown error'}</pre>
    </div>
  `;
}
=======
// Add dark mode class if previously saved
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
}

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <GameProvider>
            <App />
          </GameProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>
);
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
