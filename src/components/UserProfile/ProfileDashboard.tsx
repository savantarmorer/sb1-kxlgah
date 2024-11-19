import React from 'react';
import { useGame } from '../../contexts/GameContext';
import { motion } from 'framer-motion';
import { Trophy, Star, Book, Clock } from 'lucide-react';
import { LevelSystem } from '../../lib/levelSystem';
import { Achievements } from '../RewardSystem/Achievements';

export default function ProfileDashboard() {
  const { state } = useGame();

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Trophy className="text-yellow-500" />}
          label="Total XP"
          value={state.user.xp.toLocaleString()}
        />
        <StatCard
          icon={<Star className="text-indigo-500" />}
          label="Level"
          value={state.user.level}
        />
        <StatCard
          icon={<Book className="text-green-500" />}
          label="Quests Completed"
          value={state.completedQuests.length}
        />
        <StatCard
          icon={<Clock className="text-blue-500" />}
          label="Study Time"
          value={`${Math.floor(state.user.studyTime / 60)}h`}
        />
      </div>

      {/* Achievements Section */}
      <Achievements />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm"
    >
      <div className="flex items-center space-x-3">
        {icon}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}