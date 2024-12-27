import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Trophy, Swords, Target, ShoppingBag, Settings, Box, ScrollText, Eye } from 'lucide-react';
import { Badge } from '@mui/material';
import { useAchievements } from '../../hooks/useAchievements';
import { useVisualEditor } from '../../contexts/VisualEditorContext';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isAdmin: boolean;
}

export function Navigation({ currentView, onViewChange, isAdmin }: NavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { achievements } = useAchievements();
  const { isActive, setIsActive } = useVisualEditor();

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
    ...(isAdmin ? [
      { 
        icon: Eye, 
        label: isActive ? 'Exit Editor' : 'Visual Editor',
        onClick: () => setIsActive(!isActive),
        className: isActive ? 'text-primary-500' : ''
      }
    ] : [])
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 text-gray-400 py-2 px-4 z-40">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex justify-between items-center">
          {items.map((item) => {
            const { icon: Icon, label, path, badge, onClick, className = '' } = item;
            const isActive = path ? location.pathname === path : false;
            return (
              <button
                key={label}
                onClick={() => onClick ? onClick() : navigate(path!)}
                className={`
                  flex flex-col items-center p-2 rounded-lg
                  transition-colors duration-200
                  ${isActive ? 'text-primary-500' : 'hover:text-gray-100'}
                  ${className}
                `}
              >
                <div className="relative">
                  <Icon size={24} />
                  {badge && badge > 0 && (
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