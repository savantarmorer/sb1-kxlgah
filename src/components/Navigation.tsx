import React from 'react';
import { Trophy, Scroll, Store, User2, Home, Package, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

type View = 'home' | 'leaderboard' | 'quests' | 'store' | 'profile' | 'inventory' | 'admin';

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  showInventory?: boolean;
  isAdmin?: boolean;
}

export default function Navigation({ currentView, onViewChange, showInventory, isAdmin }: NavigationProps) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
    { id: 'quests', icon: Scroll, label: 'Quests' },
    { id: 'store', icon: Store, label: 'Store' },
    { id: 'profile', icon: User2, label: 'Profile' },
    ...(showInventory ? [{ id: 'inventory', icon: Package, label: 'Inventory' }] : []),
    ...(isAdmin ? [{ id: 'admin', icon: Shield, label: 'Admin' }] : [])
  ];

  return (
    <>
      <div className="h-16"></div>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around py-2">
            {navItems.map((item) => (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={currentView === item.id}
                onClick={() => onViewChange(item.id as View)}
              />
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}

function NavItem({ icon: Icon, label, isActive, onClick }: {
  icon: typeof Home;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`${
        isActive 
          ? 'text-indigo-600 dark:text-indigo-400' 
          : 'text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300'
      } nav-item`}
    >
      <Icon size={24} />
      <span className="text-xs">{label}</span>
    </motion.button>
  );
}