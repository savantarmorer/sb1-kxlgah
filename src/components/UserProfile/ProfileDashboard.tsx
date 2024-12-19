import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Target, Book, Award, Clock, TrendingUp, Medal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { StyledBox } from '../Layout/StyledBox';
import { PageContainer } from '../Layout/PageContainer';
import { useGame } from '../../contexts/GameContext';
import LootboxInventory from '../profile/LootboxInventory';

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
      className="card card-hover p-4 lg:p-6 h-full"
    >
      <div className="flex items-center gap-2 mb-3">
        {React.cloneElement(icon as React.ReactElement, {
          className: `w-5 h-5 lg:w-6 lg:h-6 ${color}`
        })}
        <h3 className="text-base lg:text-lg font-semibold text-app-text-primary">{title}</h3>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-end justify-between">
          <span className={`text-xl lg:text-2xl font-bold ${color}`}>{value}</span>
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
          <p className="text-xs lg:text-sm text-app-text-muted">{trendLabel}</p>
        )}
      </div>
    </motion.div>
  );
}

export default function ProfileDashboard() {
  const navigate = useNavigate();
  const { state } = useGame();

  const user = {
    name: state.user?.name || 'Admin',
    avatar: state.user?.avatar_url || '/avatars/default1.jpg',
    level: state.user?.level || 1,
    xp: state.user?.xp || 0,
    coins: state.user?.coins || 392,
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

  return (
    <PageContainer variant="gradient" className="max-w-7xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <StyledBox variant="glass" className="mb-6 lg:mb-8 p-4 lg:p-6">
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="relative">
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-16 h-16 lg:w-20 lg:h-20 rounded-full border-4 border-app-primary/30"
            />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <span className="badge-primary text-xs lg:text-sm px-2 py-0.5">
                Level {user.level}
              </span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h1 className="gradient-text-primary text-2xl lg:text-3xl font-bold mb-1 lg:mb-2 truncate">
              {user.name}
            </h1>
            <div className="flex flex-wrap gap-3 lg:gap-4">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 lg:w-5 lg:h-5 text-app-primary" />
                <span className="text-sm lg:text-base text-app-text-secondary">{user.xp} XP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 lg:w-5 lg:h-5 text-app-warning" />
                <span className="text-sm lg:text-base text-app-text-secondary">{user.coins} Coins</span>
              </div>
            </div>
          </div>
          
          <Button
            onClick={() => navigate('/battle')}
            variant="primary"
            size="lg"
            className="hidden sm:flex items-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            Battle Arena
          </Button>
        </div>
      </StyledBox>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 mb-8">
        <Button
          onClick={() => navigate('/battle')}
          variant="primary"
          className="flex items-center justify-center gap-2 py-2 lg:py-2.5"
        >
          <Trophy className="w-4 h-4" />
          Battle Arena
        </Button>
        
        <Button
          onClick={() => navigate('/practice')}
          variant="secondary"
          className="flex items-center justify-center gap-2 py-2 lg:py-2.5"
        >
          <Book className="w-4 h-4" />
          Practice
        </Button>
        
        <Button
          onClick={() => navigate('/rankings')}
          variant="outline"
          className="flex items-center justify-center gap-2 py-2 lg:py-2.5"
        >
          <Award className="w-4 h-4" />
          Rankings
        </Button>
        
        <Button
          onClick={() => navigate('/achievements')}
          variant="outline"
          className="flex items-center justify-center gap-2 py-2 lg:py-2.5"
        >
          <Medal className="w-4 h-4" />
          Achievements
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left column */}
        <div className="space-y-6 lg:space-y-8">
          <LootboxInventory />
        </div>
        
        {/* Right column */}
        <div className="space-y-6 lg:space-y-8">
          {/* Add other dashboard components here */}
        </div>
      </div>
    </PageContainer>
  );
}