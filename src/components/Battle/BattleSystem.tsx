import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Shield, Zap, Trophy, Target, Crown } from 'lucide-react';
import { use_game } from '../../contexts/GameContext';

export default function BattleSystem() {
  const { state } = use_game();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        {/* Battle Arena */}
        <motion.div 
          className="relative rounded-2xl bg-black/30 backdrop-blur-xl p-8 mb-8 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Player Character */}
            <motion.div 
              className="flex items-center justify-center"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <div className="relative">
                <img 
                  src={state.user.avatar} 
                  alt="Player Character"
                  className="w-48 h-48 rounded-full border-4 border-purple-500 shadow-lg shadow-purple-500/50"
                />
                <motion.div 
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <span className="text-white font-bold">Level {state.user.level}</span>
                </motion.div>
              </div>
            </motion.div>

            {/* VS Animation */}
            <motion.div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="text-6xl font-bold text-white/80">VS</div>
            </motion.div>

            {/* Opponent */}
            <motion.div 
              className="flex items-center justify-center"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <div className="relative">
                <img 
                  src="/opponent-placeholder.png" 
                  alt="Opponent"
                  className="w-48 h-48 rounded-full border-4 border-pink-500 shadow-lg shadow-pink-500/50"
                />
                <motion.div 
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-600 to-red-600 px-4 py-1 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <span className="text-white font-bold">Level {state.opponent?.level || '??'}</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Battle Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <BattleAction icon={<Sword />} label="Attack" onClick={() => {}} />
          <BattleAction icon={<Shield />} label="Defend" onClick={() => {}} />
          <BattleAction icon={<Zap />} label="Special" onClick={() => {}} />
          <BattleAction icon={<Target />} label="Items" onClick={() => {}} />
        </div>
      </div>
    </div>
  );
}

interface BattleActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function BattleAction({ icon, label, onClick }: BattleActionProps) {
  return (
    <motion.button
      className="relative group bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <div className="flex flex-col items-center space-y-2">
        <div className="text-white/80 text-2xl">{icon}</div>
        <span className="text-white/80 font-medium">{label}</span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
} 