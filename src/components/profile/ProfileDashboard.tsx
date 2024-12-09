import React from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Star, Sword, Target, 
  Clock, Award, TrendingUp, Crown 
} from 'lucide-react';
import { use_game } from '../../contexts/GameContext';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
}

function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex justify-between items-start">
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
          {icon}
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <h3 className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
    </motion.div>
  );
}

export default function ProfileDashboard() {
  const { state } = use_game();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div 
          className="relative rounded-2xl bg-white dark:bg-gray-800 p-8 mb-8 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-6">
            <div className="relative">
              <img 
                src={state.user.avatar} 
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-purple-500"
              />
              <motion.div 
                className="absolute -bottom-2 -right-2 bg-yellow-500 rounded-full p-2"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Crown className="w-4 h-4 text-white" />
              </motion.div>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {state.user.name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Level {state.user.level} • {state.user.avatarFrame || 'Adventurer'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Battle Rating"
            value={`#${state.user.battle_rating || '???'}`}
            icon={<Sword className="text-red-500" />}
            trend={+15}
          />
          <StatCard 
            title="Win Rate"
            value={`${Math.round((state.battle_stats?.wins || 0) / (state.battle_stats?.total_battles || 1) * 100)}%`}
            icon={<Target className="text-green-500" />}
            trend={+5}
          />
          <StatCard 
            title="Achievement Score"
            value={state.user.achievements.length}
            icon={<Trophy className="text-yellow-500" />}
            trend={+30}
          />
          <StatCard 
            title="Total Battles"
            value={state.battle_stats?.total_battles || 0}
            icon={<Star className="text-purple-500" />}
            trend={+8}
          />
        </div>
      </div>
    </div>
  );
} 