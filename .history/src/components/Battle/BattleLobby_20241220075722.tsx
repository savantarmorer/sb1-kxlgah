import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, Trophy, Star, Shield, 
  Target, Zap, Crown, Users, 
  Timer, Medal, TrendingUp, BookOpen, Scale, Gavel, FileText 
} from 'lucide-react';
import { Button } from '../Button';
import { useGame } from '../../contexts/GameContext';
import { BATTLE_CONFIG } from '../../config/battleConfig';

interface BattleLobbyStats {
  total_battles: number;
  wins: number;
  losses: number;
  win_streak: number;
  highest_streak: number;
  difficulty: number | 'easy' | 'medium' | 'hard';
  average_score: number;
}

interface BattleLobbyProps {
  onStartBattle: () => void;
  onClose: () => void;
  stats: BattleLobbyStats;
}
export function BattleLobby({ onStartBattle, onClose, stats }: BattleLobbyProps) 
type BattleCategory = 'general' | 'constitutional' | 'criminal' | 'civil';
type BattleMode = 'casual' | 'ranked';

function getRankTier(rating: number): string {
  if (rating >= 2000) return 'Master';
  if (rating >= 1800) return 'Diamond';
  if (rating >= 1600) return 'Platinum';
  if (rating >= 1400) return 'Gold';
  if (rating >= 1200) return 'Silver';
  if (rating >= 1000) return 'Bronze';
  return 'Unranked';
}

export function BattleLobby({ onStartBattle, onClose, stats }: BattleLobbyProps) {
  const { state } = useGame();
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedCategory, setSelectedCategory] = useState<BattleCategory>('general');
  const [selectedMode, setSelectedMode] = useState<BattleMode>('casual');
  const [showRules, setShowRules] = useState(false);

  const winRate = stats.total_battles > 0 
    ? Math.round((stats.wins / stats.total_battles) * 100) 
    : 0;

  const difficultyConfig = {
    easy: {
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      borderColor: 'border-green-500',
      multiplier: '0.8x'
    },
    medium: {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      borderColor: 'border-yellow-500',
      multiplier: '1x'
    },
    hard: {
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      borderColor: 'border-red-500',
      multiplier: '1.5x'
    }
  };

  const categoryConfig = {
    general: {
      title: 'Geral',
      icon: <BookOpen className="w-6 h-6" />,
      description: 'All areas of law',
      bgImage: 'url(/images/backgrounds/general-law.jpg)'
    },
    constitutional: {
      title: 'Constitucional',
      icon: <Scale className="w-6 h-6" />,
      description: 'Constitutional law questions',
      bgImage: 'url(/images/backgrounds/constitutional.jpg)'
    },
    criminal: {
      title: 'Penal',
      icon: <Gavel className="w-6 h-6" />,
      description: 'Criminal law questions',
      bgImage: 'url(/images/backgrounds/criminal.jpg)'
    },
    civil: {
      title: 'Civil',
      icon: <FileText className="w-6 h-6" />,
      description: 'Civil law questions',
      bgImage: 'url(/images/backgrounds/civil.jpg)'
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="battle-lobby max-w-6xl mx-auto p-8 rounded-xl bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 shadow-2xl border border-gray-700/50 backdrop-blur-lg"
      style={{
        backgroundImage: `linear-gradient(to bottom right, rgba(17, 24, 39, 0.97), rgba(31, 41, 55, 0.97)), ${categoryConfig[selectedCategory].bgImage}`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'overlay'
      }}
    >
      {/* Header Section */}
      <div className="text-center mb-8">
        <motion.div 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="flex items-center justify-center gap-3 mb-2"
        >
          <Swords className="w-10 h-10 text-brand-teal-400" />
          <h2 className="text-4xl font-bold bg-gradient-to-r from-brand-teal-400 via-blue-400 to-purple-400 text-transparent bg-clip-text">
            Battle Arena
          </h2>
        </motion.div>
        <p className="text-lg text-gray-300">
          Test your knowledge in epic legal battles
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="stat-card p-4 rounded-lg bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/30 hover:border-purple-400/50 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <span className="font-semibold text-gray-100">Win Rate</span>
          </div>
          <p className="text-2xl font-bold text-brand-teal-400">{winRate}%</p>
          <p className="text-sm text-gray-400">
            {stats.wins}W - {stats.losses}L
          </p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="stat-card p-4 rounded-lg bg-gradient-to-br from-orange-900/50 to-red-900/50 border border-orange-500/30 hover:border-orange-400/50 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-6 h-6 text-yellow-400" />
            <span className="font-semibold text-gray-100">Win Streak</span>
          </div>
          <p className="text-2xl font-bold text-orange-400">{stats.win_streak}</p>
          <p className="text-sm text-gray-400">
            Best: {stats.highest_streak}
          </p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="stat-card p-4 rounded-lg bg-gradient-to-br from-green-900/50 to-teal-900/50 border border-green-500/30 hover:border-green-400/50 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <span className="font-semibold text-gray-100">Avg Score</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{stats.average_score}%</p>
          <p className="text-sm text-gray-400">
            {stats.total_battles} Total Battles
          </p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="stat-card p-4 rounded-lg bg-gradient-to-br from-blue-900/50 to-indigo-900/50 border border-blue-500/30 hover:border-blue-400/50 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <Medal className="w-6 h-6 text-blue-400" />
            <span className="font-semibold text-gray-100">Rank</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">
            {selectedMode === 'ranked' 
              ? getRankTier(state.battleRatings?.rating || 0)
              : '-'
            }
          </p>
          <p className="text-sm text-gray-400">
            {selectedMode === 'ranked' 
              ? `${state.battleRatings?.rating || 0} Rating` 
              : 'Casual Mode'
            }
          </p>
        </motion.div>
      </div>

      {/* Battle Categories */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Select Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.entries(categoryConfig) as [BattleCategory, typeof categoryConfig[BattleCategory]][]).map(([category, config]) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCategory(category)}
              className={`
                p-6 rounded-lg border-2 transition-all relative overflow-hidden
                ${selectedCategory === category 
                  ? 'border-brand-teal-400 bg-gradient-to-br from-brand-teal-900/50 to-brand-teal-800/30' 
                  : 'border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:border-gray-600'}
              `}
            >
              <div className="text-center relative z-10">
                <div className="flex justify-center mb-2">
                  {React.cloneElement(config.icon, { className: "w-6 h-6 text-brand-teal-400" })}
                </div>
                <p className="font-semibold text-gray-100">
                  {config.title}
                </p>
                <p className="text-sm text-gray-400">
                  {config.description}
                </p>
                {category !== 'general' && (
                  <span className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full bg-yellow-900/30 text-yellow-400 border border-yellow-700/30">
                    Coming Soon
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Battle Mode Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Battle Mode</h3>
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedMode('casual')}
            className={`
              p-4 rounded-lg border-2 transition-all
              ${selectedMode === 'casual' 
                ? 'border-brand-teal-400 bg-gradient-to-br from-brand-teal-900/50 to-brand-teal-800/30' 
                : 'border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:border-gray-600'}
            `}
          >
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Users className="w-6 h-6 text-brand-teal-400" />
              </div>
              <p className="font-semibold text-gray-100">Casual</p>
              <p className="text-sm text-gray-400">Practice and learn</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedMode('ranked')}
            className={`
              p-4 rounded-lg border-2 transition-all
              ${selectedMode === 'ranked' 
                ? 'border-brand-teal-400 bg-gradient-to-br from-brand-teal-900/50 to-brand-teal-800/30' 
                : 'border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:border-gray-600'}
            `}
          >
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Trophy className="w-6 h-6 text-brand-teal-400" />
              </div>
              <p className="font-semibold text-gray-100">Ranked</p>
              <p className="text-sm text-gray-400">Compete for glory</p>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Difficulty Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Select Difficulty</h3>
        <div className="grid grid-cols-3 gap-4">
          {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
            <motion.button
              key={difficulty}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedDifficulty(difficulty)}
              className={`
                p-4 rounded-lg border-2 transition-all bg-gradient-to-br
                ${selectedDifficulty === difficulty 
                  ? `${difficultyConfig[difficulty].borderColor} ${difficultyConfig[difficulty].bgColor}` 
                  : 'border-gray-700 from-gray-800/50 to-gray-900/50 hover:border-gray-600'}
              `}
            >
              <div className="text-center">
                <p className={`font-semibold capitalize ${difficultyConfig[difficulty].color}`}>
                  {difficulty}
                </p>
                <p className="text-sm text-gray-400">
                  Rewards {difficultyConfig[difficulty].multiplier}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Battle Rules */}
      <motion.div 
        className="mb-8"
        initial={false}
        animate={{ height: showRules ? 'auto' : '40px' }}
      >
        <button
          onClick={() => setShowRules(!showRules)}
          className="flex items-center gap-2 text-gray-400 hover:text-brand-teal-400 transition-colors"
        >
          <Shield className="w-5 h-5" />
          <span className="font-medium">Battle Rules</span>
        </button>
        
        <AnimatePresence>
          {showRules && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700"
            >
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Answer {BATTLE_CONFIG.questions_per_battle} questions correctly to win</li>
                <li>• Each question has a {BATTLE_CONFIG.time_per_question} second time limit</li>
                <li>• Earn bonus points for quick answers</li>
                <li>• Maintain your streak for bonus rewards</li>
                <li>• Higher difficulties offer better rewards</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 gap-4">
        <Button
          onClick={() => onStartBattle()}
          variant="primary"
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-brand-teal-500 via-brand-teal-400 to-blue-500 hover:from-brand-teal-600 hover:via-brand-teal-500 hover:to-blue-600 text-white font-semibold text-lg"
          disabled={selectedCategory !== 'general'}
        >
          <Swords className="w-5 h-5" />
          {selectedCategory === 'general' ? 'Start Battle' : 'Coming Soon'}
        </Button>

        <Button
          onClick={onClose}
          variant="outline"
          className="w-full border-gray-700 text-gray-400 hover:bg-gray-800 hover:border-gray-600 transition-colors"
        >
          Return to Menu
        </Button>
      </div>
    </motion.div>
  );
} 