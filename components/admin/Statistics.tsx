import { useState, useEffect } from 'react';
import { Users, Award, TrendingUp, RefreshCw } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { useAdminActions } from '../../hooks/useAdminActions';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import Button from '../Button';

/**
 * Interface for statistics data
 * Includes all metrics and activity tracking
 */
interface StatsData {
  activeUsers: number;
  completedQuests: number;
  purchasedItems: number;
  lastUpdated: Date;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
    value?: number;
  }>;
}

/**
 * Interface for statistic cards
 * Used to display individual metric cards
 */
interface StatCard {
  label: string;
  value: number;
  icon: JSX.Element;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  color: string;
}

/**
 * Statistics Component
 * Displays admin dashboard statistics and metrics
 */
export default function Statistics() {
  const { state } = useGame();
  const { fetchStatistics } = useAdminActions();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<StatsData>({
    activeUsers: 0,
    completedQuests: 0,
    purchasedItems: 0,
    lastUpdated: new Date(),
    recentActivity: []
  });

  /**
   * Loads initial statistics
   * Called on component mount and refresh
   */
  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await fetchStatistics();
      if (data) {
        setStats(prev => ({
          ...prev,
          ...data,
          lastUpdated: new Date()
        }));
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  /**
   * Handles manual refresh of statistics
   * Updates all metrics and last updated timestamp
   */
  const handleRefresh = async () => {
    await loadStats();
  };

  /**
   * Formats the last updated timestamp
   */
  const getLastUpdatedText = () => `Last updated: ${format(stats.lastUpdated, 'PPpp')}`;

  /**
   * Defines the statistic cards configuration
   * Each card represents a key metric
   */
  const statCards: StatCard[] = [
    {
      label: 'Active Users',
      value: stats.activeUsers,
      icon: <Users className="text-blue-500" />,
      change: '+12%',
      trend: 'up',
      color: 'blue'
    },
    {
      label: 'Completed Quests',
      value: stats.completedQuests,
      icon: <Award className="text-green-500" />,
      change: '+8%',
      trend: 'up',
      color: 'green'
    },
    {
      label: 'Purchased Items',
      value: stats.purchasedItems,
      icon: <TrendingUp className="text-purple-500" />,
      change: '+15%',
      trend: 'up',
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatePresence mode="wait">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</p>
                  <h3 className="text-2xl font-bold mt-1 dark:text-white">
                    {isLoading ? '...' : stat.value.toLocaleString()}
                  </h3>
                </div>
                {stat.icon}
              </div>
              <div className="mt-4">
                <span className={`text-sm ${
                  stat.trend === 'up' ? 'text-green-500' :
                  stat.trend === 'down' ? 'text-red-500' :
                  'text-gray-500'
                }`}>
                  {stat.change} from last month
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold dark:text-white">Recent Activity</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            icon={<RefreshCw className={isLoading ? 'animate-spin' : ''} size={16} />}
          >
            Refresh
          </Button>
        </div>
        <div className="space-y-4">
          {state.recentXPGains.map((gain, index) => (
            <motion.div
              key={gain.timestamp}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg"
            >
              <div>
                <p className="font-medium dark:text-white">{gain.reason}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {new Date(gain.timestamp).toLocaleString()}
                </p>
              </div>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                +{gain.amount} XP
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Last Updated Info */}
      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
        <span>{getLastUpdatedText()}</span>
      </div>
    </div>
  );
}

/**
 * Component Dependencies:
 * - useGame: For accessing game state and recent activity
 * - useAdminActions: For fetching statistics
 * - Button: For UI interactions
 * - Framer Motion: For animations
 * 
 * State Management:
 * - Local state for statistics data
 * - Loading state for UI feedback
 * 
 * Data Flow:
 * - Fetches statistics from backend through useAdminActions
 * - Updates local state with new data
 * - Displays metrics and activity from game state
 * 
 * Used By:
 * - AdminDashboard component
 * 
 * Features:
 * - Real-time statistics display
 * - Recent activity tracking
 * - Manual refresh capability
 * - Loading states
 * - Animated transitions
 * 
 * Scalability Considerations:
 * - Modular card system for easy metric addition
 * - Separate interfaces for clear data structure
 * - Reusable animation configurations
 * - Error handling for data fetching
 */