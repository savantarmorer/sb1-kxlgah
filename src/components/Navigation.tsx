import React from 'react';
<<<<<<< HEAD
import { Trophy, Scroll, Store, User2, Home, Package } from 'lucide-react';
import { motion } from 'framer-motion';

type View = 'home' | 'leaderboard' | 'quests' | 'store' | 'profile' | 'inventory' | 'admin';

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  showInventory?: boolean;
}

export default function Navigation({ currentView, onViewChange, showInventory = false }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
=======
import { Trophy, Scroll, Store, User2, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavigationProps {
  currentView: 'home' | 'leaderboard' | 'quests' | 'store' | 'profile';
  onViewChange: (view: 'home' | 'leaderboard' | 'quests' | 'store' | 'profile') => void;
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-white/80 to-white dark:from-gray-900/80 dark:to-gray-900 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16">
        <div className="flex justify-between items-center h-full">
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
          <NavItem
            icon={<Home />}
            label="Home"
            isActive={currentView === 'home'}
            onClick={() => onViewChange('home')}
          />
          <NavItem
            icon={<Trophy />}
            label="Ranking"
            isActive={currentView === 'leaderboard'}
            onClick={() => onViewChange('leaderboard')}
          />
          <NavItem
            icon={<Scroll />}
            label="Missões"
            isActive={currentView === 'quests'}
            onClick={() => onViewChange('quests')}
          />
          <NavItem
            icon={<Store />}
            label="Loja"
            isActive={currentView === 'store'}
            onClick={() => onViewChange('store')}
          />
<<<<<<< HEAD
          {showInventory && (
            <NavItem
              icon={<Package />}
              label="Inventário"
              isActive={currentView === 'inventory'}
              onClick={() => onViewChange('inventory')}
            />
          )}
=======
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
          <NavItem
            icon={<User2 />}
            label="Perfil"
            isActive={currentView === 'profile'}
            onClick={() => onViewChange('profile')}
          />
        </div>
      </div>
    </nav>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, isActive, onClick }: NavItemProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
<<<<<<< HEAD
      className={`relative flex flex-col items-center justify-center w-16 ${
=======
      className={`relative flex flex-col items-center justify-center w-16 h-16 ${
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
        isActive 
          ? 'text-indigo-600 dark:text-indigo-400' 
          : 'text-gray-500 dark:text-gray-400'
      }`}
    >
      <div className="relative">
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute -inset-2 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-lg -z-10"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        {icon}
      </div>
      <span className="text-xs mt-1 font-medium">{label}</span>
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
<<<<<<< HEAD
          className="absolute -top-1 w-8 h-0.5 bg-indigo-600 dark:bg-indigo-400"
=======
          className="absolute bottom-0 w-8 h-0.5 bg-indigo-600 dark:bg-indigo-400"
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </motion.button>
  );
}