import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Target, Book, Award, Clock, TrendingUp, Medal, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../Button';
import { StyledBox } from '../Layout/StyledBox';
import { PageContainer } from '../Layout/PageContainer';
import { useGame } from '../../contexts/GameContext';
import TitleSelector from './TitleSelector';
import { Dialog } from '@mui/material';

interface ProfileDashboardProps {
  onClose?: () => void;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: string;
}

function StatCard({ title, value, icon, trend, trendLabel, color = 'text-app-primary' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card card-hover p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        {React.cloneElement(icon as React.ReactElement, {
          className: `w-6 h-6 ${color}`
        })}
        <h3 className="text-lg font-semibold text-app-text-primary">{title}</h3>
      </div>

      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <span className={`text-2xl font-bold ${color}`}>{value}</span>
          {trend && (
            <div className="flex items-center gap-1">
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4 text-app-success" />
              ) : (
                <TrendingUp className="w-4 h-4 text-app-error rotate-180" />
              )}
              <span className={trend > 0 ? 'text-app-success' : 'text-app-error'}>
                {Math.abs(trend)}%
              </span>
            </div>
          )}
        </div>
        {trendLabel && (
          <p className="text-sm text-app-text-muted">{trendLabel}</p>
        )}
      </div>
    </motion.div>
  );
}

export default function ProfileDashboard({ onClose }: ProfileDashboardProps) {
  const navigate = useNavigate();
  const { state } = useGame();

  // Valores padrão para user e stats
  const user = {
    name: state.user?.name || 'User',
    avatar: state.user?.avatar_url || '/avatars/default1.jpg',
    level: state.user?.level || 1,
    xp: state.user?.xp || 0,
    coins: state.user?.coins || 0,
  };

  const stats = {
    totalBattles: state.battle_stats?.total_battles || 0,
    wins: state.battle_stats?.wins || 0,
    losses: state.battle_stats?.losses || 0,
    winStreak: state.battle_stats?.win_streak || 0,
    highestStreak: state.battle_stats?.highest_streak || 0,
    averageScore: state.battle_stats?.total_battles 
      ? Math.round((state.battle_stats.wins / state.battle_stats.total_battles) * 100)
      : 0
  };

  const winRate = stats.totalBattles > 0 
    ? Math.round((stats.wins / stats.totalBattles) * 100) 
    : 0;

  const [showTitleSelector, setShowTitleSelector] = useState(false);

  return (
    <PageContainer variant="gradient">
      {/* Profile Header */}
      <StyledBox variant="glass" className="mb-8 p-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-24 h-24 rounded-full border-4 border-app-primary/30"
            />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <span className="badge-primary">
                Level {user.level}
              </span>
            </div>
          </div>
          
          <div className="flex-1">
            <h1 className="gradient-text-primary text-3xl font-bold mb-2">
              {user.name}
            </h1>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-app-primary" />
                <span className="text-app-text-secondary">{user.xp} XP</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-app-warning" />
                <span className="text-app-text-secondary">{user.coins} Coins</span>
              </div>
            </div>
          </div>
          
          <Button
            onClick={() => navigate('/battle')}
            variant="primary"
            size="lg"
            icon={<Trophy />}
          >
            Battle Arena
          </Button>
        </div>
      </StyledBox>

      {/* Title Management */}
      <StyledBox variant="glass" className="mb-8 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Display Title
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current Title: <span className={getTitleStyle(state.user?.display_title)}>
                {state.user?.display_title || 'Adventurer'}
              </span>
            </p>
          </div>
          <Button
            onClick={() => setShowTitleSelector(true)}
            variant="outline"
            icon={<Crown className="w-4 h-4" />}
          >
            Change Title
          </Button>
        </div>
      </StyledBox>

      {/* Title Selector Modal */}
      {showTitleSelector && (
        <Dialog
          open={showTitleSelector}
          onClose={() => setShowTitleSelector(false)}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="fixed inset-0 bg-black/50" />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl mx-4">
            <TitleSelector />
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => setShowTitleSelector(false)}
                variant="secondary"
                fullWidth
              >
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Battle Stats"
          value={`${winRate}%`}
          icon={<Target />}
          trend={5}
          trendLabel={`${stats.wins}W - ${stats.losses}L`}
          color="text-app-primary"
        />

        <StatCard
          title="Win Streak"
          value={stats.winStreak}
          icon={<Award />}
          trendLabel={`Best: ${stats.highestStreak}`}
          color="text-app-warning"
        />

        <StatCard
          title="Average Score"
          value={`${stats.averageScore}%`}
          icon={<Medal />}
          trendLabel={`${stats.totalBattles} Total Battles`}
          color="text-app-success"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          onClick={() => navigate('/battle')}
          variant="primary"
          fullWidth
          icon={<Trophy />}
        >
          Battle Arena
        </Button>
        
        <Button
          onClick={() => navigate('/practice')}
          variant="secondary"
          fullWidth
          icon={<Book />}
        >
          Practice
        </Button>
        
        <Button
          onClick={() => navigate('/rankings')}
          variant="outline"
          fullWidth
          icon={<Award />}
        >
          Rankings
        </Button>
        
        <Button
          onClick={() => navigate('/achievements')}
          variant="outline"
          fullWidth
          icon={<Medal />}
        >
          Achievements
        </Button>
      </div>
    </PageContainer>
  );
}
