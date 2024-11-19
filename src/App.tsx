import React from 'react';
import { useAuth } from './contexts/AuthContext';
import AuthForm from './components/Auth/AuthForm';
import AppContent from './components/AppContent';
import LoadingScreen from './components/LoadingScreen';
import { Toaster } from 'react-hot-toast';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
          },
        }}
      />
      {user ? <AppContent /> : <AuthForm />}
    </>
  );
}

export default App;
