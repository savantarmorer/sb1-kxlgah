import React from 'react';
<<<<<<< HEAD
import { Trophy, Star, Lock, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../../contexts/GameContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LevelSystem as LevelCalculator } from '../../lib/levelSystem';

const LEVEL_REWARDS = [
  {
    level: 1,
    rewards: [
      {
        type: 'feature',
        title: 'Personalização de Perfil',
        description: 'Desbloqueie opções de personalização do seu perfil',
        icon: <Star className="text-yellow-400" />
      }
    ]
  },
  {
    level: 2,
    rewards: [
      {
        type: 'feature',
        title: 'Simulados',
        description: 'Acesso a simulados práticos',
        icon: <Trophy className="text-blue-400" />
      }
    ]
  },
  {
    level: 5,
    rewards: [
      {
        type: 'title',
        title: 'Título: Estudante Dedicado',
        description: 'Um título especial para seu perfil',
        icon: <Gift className="text-purple-400" />
      }
    ]
  },
  {
    level: 10,
    rewards: [
      {
        type: 'feature',
        title: 'Modo Batalha Avançado',
        description: 'Desbloqueie batalhas especiais com recompensas únicas',
        icon: <Trophy className="text-indigo-400" />
      }
    ]
  }
];

export function LevelSystem() {
  const { state } = useGame();
  const { t } = useLanguage();
  const currentLevel = state.user.level;
=======
import { Trophy, Star, Lock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface Level {
  level: number;
  xpRequired: number;
  rewards: {
    title: string;
    description: string;
    icon: React.ReactNode;
  }[];
}

export function LevelSystem({ currentXP = 0 }) {
  const { t } = useLanguage();

  const LEVELS: Level[] = [
    {
      level: 1,
      xpRequired: 0,
      rewards: [
        {
          title: t('levels.1.rewards.profileCustomization.title'),
          description: t('levels.1.rewards.profileCustomization.description'),
          icon: <Star className="text-yellow-400" />
        }
      ]
    },
    {
      level: 2,
      xpRequired: 100,
      rewards: [
        {
          title: t('levels.2.rewards.mockExam.title'),
          description: t('levels.2.rewards.mockExam.description'),
          icon: <Trophy className="text-blue-400" />
        }
      ]
    }
  ];

  const getCurrentLevel = () => {
    return LEVELS.reduce((highest, level) => 
      currentXP >= level.xpRequired ? level : highest
    );
  };

  const currentLevel = getCurrentLevel();
  const nextLevel = LEVELS.find(level => level.xpRequired > currentXP);
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
<<<<<<< HEAD
        <h2 className="heading text-xl">{t('common.level')} {currentLevel}</h2>
        <div className="text-sm text-muted">
          {state.user.xp} / {LevelCalculator.calculateXPForLevel(currentLevel + 1)} XP
=======
        <h2 className="heading text-xl">{t('common.level')} {currentLevel.level}</h2>
        <div className="text-sm text-muted">
          {currentXP} / {nextLevel?.xpRequired || '∞'} XP
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
        </div>
      </div>

      <div className="space-y-6">
<<<<<<< HEAD
        {LEVEL_REWARDS.map(({ level, rewards }) => (
          <motion.div
            key={level}
            initial={false}
            animate={{
              scale: currentLevel >= level ? [1.02, 1] : 1,
              transition: { duration: 0.3 }
            }}
            className={`p-4 rounded-lg ${
              currentLevel >= level
=======
        {LEVELS.map(level => (
          <div
            key={level.level}
            className={`p-4 rounded-lg ${
              currentXP >= level.xpRequired
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
                ? 'bg-brand-teal-50 dark:bg-brand-teal-900/20 border border-brand-teal-200 dark:border-brand-teal-800'
                : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
<<<<<<< HEAD
                Nível {level}
              </h3>
              {currentLevel >= level ? (
=======
                {t('common.level')} {level.level}
              </h3>
              {currentXP >= level.xpRequired ? (
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
                <span className="text-brand-teal-600 dark:text-brand-teal-400 text-sm font-medium">
                  {t('common.unlocked')}
                </span>
              ) : (
                <Lock size={16} className="text-gray-400 dark:text-gray-500" />
              )}
            </div>
<<<<<<< HEAD
            <div className="space-y-3">
              {rewards.map((reward, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 text-sm text-muted"
                >
                  {reward.icon}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {reward.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {reward.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
=======
            <div className="space-y-2">
              {level.rewards.map((reward, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 text-sm text-muted"
                >
                  {reward.icon}
                  <span>{reward.title}</span>
                </div>
              ))}
            </div>
          </div>
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
        ))}
      </div>
    </div>
  );
}