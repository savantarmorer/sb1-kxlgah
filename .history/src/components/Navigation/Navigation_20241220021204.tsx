import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Trophy, Swords, Target, ShoppingBag, Settings, Box, ScrollText } from 'lucide-react';
import { Badge } from '@mui/material';
import { useAchievements } from '../../hooks/useAchievements';

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { achievements } = useAchievements();

  const unclaimedCount = achievements.filter(a => a.ready_to_claim && !a.claimed).length;

  const items = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Swords, label: 'Battle', path: '/battle' },
    { icon: Target, label: 'Tournament', path: '/tournament' },
    { 
      icon: Trophy, 
      label: 'Achievements', 
      path: '/achievements',
      badge: unclaimedCount
    },
    { icon: ScrollText, label: 'Quests', path: '/quests' },
    { icon: ShoppingBag, label: 'Shop', path: '/shop' },
    { icon: Box, label: 'Inventory', path: '/inventory' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 text-gray-400 py-2 px-4">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex justify-between items-center">
          {items.map(({ icon: Icon, label, path, badge }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`
                  flex flex-col items-center p-2 rounded-lg
                  transition-colors duration-200
                  ${isActive ? 'text-primary-500' : 'hover:text-gray-100'}
                `}
              >
                <div className="relative">
                  <Icon size={24} />
                  {badge > 0 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
                <span className="text-xs mt-1">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
} 