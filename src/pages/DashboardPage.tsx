import React from 'react';
import StatsDashboard from '../components/Dashboard/StatsDashboard';
import { useUserStats } from '../hooks/useUserStats';

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
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-64 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500">Failed to load dashboard data</div>
        <div className="text-sm text-gray-500 mt-2">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Performance Dashboard
        </h1>
        <StatsDashboard />
      </div>
    </div>
  );
}
