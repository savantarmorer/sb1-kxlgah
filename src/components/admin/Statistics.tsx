// src/components/admin/Statistics.tsx
import { useState, useEffect } from 'react';
import { Users, Award, TrendingUp, RefreshCw, Swords } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { StatisticsService } from '../../services/statisticsService';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import Button from '../Button';
import type { GameStatistics } from '../../types/game';

interface StatCard {
  label: string;
  value: number;
  icon: JSX.Element;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  color: string;
}

interface ActivityItem {
  type: 'battle' | 'quest' | 'purchase';
  description: string;
  timestamp: Date;
  value?: number;
}

export default function Statistics() {
  const { state } = useGame();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<GameStatistics | null>(null);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await StatisticsService.fetchStatistics();
      if (data) {
        setStats(data);
      }
    } catch (error) {
      setError('Failed to load statistics');
      console.error('Error loading statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const statCards = stats ? [
    {
      label: 'Active Users',
      value: stats.activeUsers,
      icon: <Users className="text-blue-500" />,
      change: '+12%',
      trend: 'up' as const,
      color: 'blue'
    },
    {
      label: 'Completed Quests',
      value: stats.completedQuests,
      icon: <Award className="text-green-500" />,
      change: '+8%',
      trend: 'up' as const,
      color: 'green'
    },
    {
      label: 'Battles Played',
      value: stats.battlesPlayed,
      icon: <Swords className="text-purple-500" />,
      change: '+15%',
      trend: 'up' as const,
      color: 'purple'
    },
    {
      label: 'Purchased Items',
      value: stats.purchasedItems,
      icon: <TrendingUp className="text-orange-500" />,
      change: '+10%',
      trend: 'up' as const,
      color: 'orange'
    }
  ] : [];

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              {/* Card content remains the same */}
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
            onClick={loadStats}
            disabled={isLoading}
            icon={<RefreshCw className={isLoading ? 'animate-spin' : ''} size={16} />}
          >
            Refresh
          </Button>
        </div>
        <div className="space-y-4">
          {stats?.recentActivity.map((activity, index) => (
            <motion.div
              key={activity.timestamp.toString()}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg"
            >
              <div>
                <p className="font-medium dark:text-white">{activity.description}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {format(activity.timestamp, 'PPpp')}
                </p>
              </div>
              {activity.value && (
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {activity.type === 'battle' ? `${activity.value} points` : `+${activity.value}`}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Last Updated */}
      {stats && (
        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
          <span>Last updated: {format(new Date(stats.lastUpdated), 'PPpp')}</span>
        </div>
      )}
    </div>
  );
}