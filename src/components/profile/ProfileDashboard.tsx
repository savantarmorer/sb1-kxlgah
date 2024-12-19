import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Target, Book, Award, Clock, TrendingUp, Medal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { StyledBox } from '../Layout/StyledBox';
import { PageContainer } from '../Layout/PageContainer';
import { useGame } from '../../contexts/GameContext';
import LootboxInventory from './LootboxInventory';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: string;
}

function StatCard({ title, value, icon, trend, trendLabel, color = 'text-cyan-500' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
    >
      <div className="flex items-center gap-2 mb-3">
        {React.cloneElement(icon as React.ReactElement, {
          className: `w-5 h-5 ${color}`
        })}
        <h3 className="text-base font-semibold text-white">{title}</h3>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-end justify-between">
          <span className={`text-2xl font-bold ${color}`}>{value}</span>
          {trend && (
            <div className="flex items-center gap-1">
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
              )}
              <span className={trend > 0 ? 'text-emerald-500' : 'text-red-500'}>
                {Math.abs(trend)}%
              </span>
            </div>
          )}
        </div>
        {trendLabel && (
          <p className="text-sm text-gray-400">{trendLabel}</p>
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
    <PageContainer variant="gradient" className="max-w-7xl mx-auto px-4 py-6 bg-[#0f172a]">
      {/* Level Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-white">Level {user.level}</h2>
          <span className="text-sm text-gray-400">{user.xp} / 759 XP</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '63%' }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-400">Coins</span>
          </div>
          <span className="text-2xl font-bold text-white">{user.coins}</span>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-sm text-gray-400">Battle Rating</span>
          </div>
          <span className="text-2xl font-bold text-white">0</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
        <StatCard
          title="Battle Stats"
          value={`${winRate}%`}
          icon={<Target className="text-cyan-500" />}
          trend={5}
          trendLabel={`${stats.wins}W - ${stats.losses}L`}
          color="text-cyan-500"
        />

        <StatCard
          title="Win Streak"
          value={stats.winStreak}
          icon={<Award className="text-amber-500" />}
          trendLabel={`Best: ${stats.highestStreak}`}
          color="text-amber-500"
        />

        <StatCard
          title="Average Score"
          value={`${stats.averageScore}%`}
          icon={<Medal className="text-emerald-500" />}
          trendLabel={`${stats.totalBattles} Total Battles`}
          color="text-emerald-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Button
          onClick={() => navigate('/battle')}
          variant="primary"
          className="flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/20"
        >
          <Trophy className="w-4 h-4" />
          Battle Arena
        </Button>
        
        <Button
          onClick={() => navigate('/practice')}
          variant="secondary"
          className="flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg shadow-violet-500/20"
        >
          <Book className="w-4 h-4" />
          Practice
        </Button>
        
        <Button
          onClick={() => navigate('/rankings')}
          variant="outline"
          className="flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10"
        >
          <Award className="w-4 h-4" />
          Rankings
        </Button>
        
        <Button
          onClick={() => navigate('/achievements')}
          variant="outline"
          className="flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10"
        >
          <Medal className="w-4 h-4" />
          Achievements
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Lootbox Inventory</h2>
            <span className="text-sm text-gray-400">11 unclaimed</span>
          </div>
          <LootboxInventory />
        </div>
        
        {/* Right column */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
            <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              View All
            </button>
          </div>
          <div className="flex items-center justify-center h-48 text-gray-500">
            No recent activity
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
