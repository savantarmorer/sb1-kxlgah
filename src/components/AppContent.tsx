import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Box, Container, Card } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Navigation from './Navigation';
import Dashboard from './Dashboard/Dashboard';
import BattleMode from './Battle/BattleMode';
import InventorySystem from './inventory/InventorySystem';
import ShopSystem from './Shop/ShopSystem';
import Settings from './Settings/Settings';
import type { View } from '../types/navigation';
import { useGame } from '../contexts/GameContext';
import TournamentMode from './Tournament/TournamentMode';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingScreen from './LoadingScreen';
import type { AppTheme } from '../theme/types/theme.d';

const ROUTE_BASE = '/home';
const LOADING_DELAY = 500;

export default function AppContent(): JSX.Element {
  console.log('AppContent rendering...');
  const theme = useTheme<AppTheme>();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useGame();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, LOADING_DELAY);

    return () => clearTimeout(timer);
  }, []);

  if (!state) {
    return <LoadingScreen />;
  }

  const handleBattleClose = (): void => {
    navigate(ROUTE_BASE);
  };

  const handleViewChange = (view: View): void => {
    if (location.pathname !== view) {
      setIsLoading(true);
    }
    const baseRoute = view === '/' ? ROUTE_BASE : `${ROUTE_BASE}${view}`;
    navigate(baseRoute);
  };

  const currentView = location.pathname.replace(ROUTE_BASE, '') as View;

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: theme.colors.dark.background.default,
      color: theme.colors.neutral.white 
    }}>
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <Container 
          maxWidth="xl" 
          sx={{ 
            px: 3,
            pt: '96px',
            pb: '128px',
          }}
        >
          <Card 
            sx={{ 
              p: 3,
              boxShadow: theme.shadow.xl,
              backdropFilter: 'blur(8px)',
              backgroundColor: `${theme.colors.dark.background.paper}80`,
              border: `1px solid ${theme.colors.dark.border}`,
              transform: 'none',
              transition: 'none'
            }}
          >
            {isLoading ? (
              <LoadingScreen />
            ) : (
              <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/battle" element={<BattleMode on_close={handleBattleClose} />} />
                  <Route path="/inventory" element={<InventorySystem />} />
                  <Route path="/shop" element={<ShopSystem />} />
                  <Route path="/tournament" element={<TournamentMode />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Box>
            )}
          </Card>
        </Container>
      </Box>

      <Navigation 
        currentView={currentView}
        onViewChange={handleViewChange}
        isAdmin={state.user?.isAdmin ?? false}
      />

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </Box>
  );
}