import React from 'react';
import StatsDashboard from '../components/Dashboard/StatsDashboard';
import { useUserStats } from '../hooks/useUserStats';
import { Box, Container } from '@mui/material';

/**
 * DashboardPage Component
 * Full-page view of user statistics and progress
 * 
 * Database Integration:
 * - Comprehensive stats from multiple tables
 * - Real-time progress updates
 * - Performance metrics
 */
export default function DashboardPage() {
  const { isLoading, error } = useUserStats();

  if (isLoading) {
    return (
      <Box sx={{ 
        height: '100vh',
        overflow: 'hidden',
        bgcolor: 'background.default'
      }}>
        <Container maxWidth="lg" sx={{ 
          height: '100%',
          overflow: 'auto',
          py: 3
        }}>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded shadow-sm" />
              ))}
            </div>
          </div>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default'
      }}>
        <Container maxWidth="lg">
          <div className="text-center">
            <div className="text-red-500 dark:text-red-400 text-lg">Failed to load dashboard data</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">{error.message}</div>
          </div>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100vh',
      overflow: 'hidden',
      bgcolor: 'background.default'
    }}>
      <Container 
        maxWidth="lg" 
        sx={{ 
          height: '100%',
          overflow: 'auto',
          py: 3
        }}
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Performance Dashboard
        </h1>
        <StatsDashboard />
      </Container>
    </Box>
  );
}
