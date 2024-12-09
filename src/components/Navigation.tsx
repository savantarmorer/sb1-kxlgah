import React from 'react';
import { Trophy, Scroll, Store, User2, Home, Package, Shield, Swords, ShoppingBag, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { View } from '../types/navigation';

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  showInventory?: boolean;
  isAdmin?: boolean;
}

export default function Navigation({ currentView, onViewChange, isAdmin = false }: NavigationProps) {
  const handleNavClick = (view: View) => {
    console.log('Navigation clicked:', view);
    console.log('Current view:', currentView);
    onViewChange(view);
  };

  const navItems = [
    { id: '/' as View, label: 'Home', icon: Home },
    { id: '/battle' as View, label: 'Battle', icon: Swords },
    { id: '/tournament' as View, label: 'Tournament', icon: Trophy },
    { id: '/inventory' as View, label: 'Inventory', icon: Package },
    { id: '/shop' as View, label: 'Shop', icon: Store },
    { id: '/settings' as View, label: 'Settings', icon: User2 }
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", bounce: 0.2 }}
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 backdrop-blur-lg bg-opacity-80 dark:bg-opacity-80 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavItem
                key={item.id}
                icon={<Icon />}
                label={item.label}
                is_active={currentView === item.id}
                onClick={() => handleNavClick(item.id)}
              />
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  is_active: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, is_active, onClick }: NavItemProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      whileHover={{ y: -2 }}
      className={`relative flex flex-col items-center justify-center w-16 ${
        is_active 
          ? 'text-indigo-600 dark:text-indigo-400' 
          : 'text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300'
      }`}
    >
      <div className="relative">
        {is_active && (
          <motion.div
            layoutId="activeTab"
            className="absolute -inset-3 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-xl -z-10"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <motion.div
          animate={is_active ? { scale: 1.1 } : { scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
        >
          {icon}
        </motion.div>
      </div>
      <motion.span 
        className="text-xs mt-1 font-medium"
        animate={is_active ? { 
          scale: 1.05,
          fontWeight: "600"
        } : { 
          scale: 1,
          fontWeight: "500"
        }}
      >
        {label}
      </motion.span>
      {is_active && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute -top-1 w-8 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </motion.button>
  );
}