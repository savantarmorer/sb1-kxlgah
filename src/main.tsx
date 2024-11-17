import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

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