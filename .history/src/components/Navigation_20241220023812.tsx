import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Box,
  useTheme,
  alpha,
  Avatar,
  Typography,
  Button,
  Chip,
} from '@mui/material';
import { 
  Trophy, Store, Home, Package, 
  Settings, Mail, MessageCircle,
  Gem, Coins, ChevronDown, X, Medal,
  LucideIcon
} from 'lucide-react';
import { View } from '../types/navigation';
import { useGame } from '../contexts/GameContext';
import { useAchievements } from '../hooks/useAchievements';
import { Achievement } from '../types/achievements';
import ProfileDashboard from './UserProfile/ProfileDashboard';
import { supabase } from '../lib/supabase';

// Slot machine style animated counter
const SlotMachineCounter = ({ value, className }: { value: number, className?: string }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setIsAnimating(false);
        setDisplayValue(value);
        prevValue.current = value;
      }, 1000); // Duration of animation
      return () => clearTimeout(timeout);
    }
  }, [value]);

  if (isAnimating) {
    return (
      <div className={`flex overflow-hidden ${className}`}>
        {value.toLocaleString().split('').map((digit, index) => (
          <motion.span
            key={`${index}-${digit}`}
            initial={{ y: -20, opacity: 0 }}
            animate={{ 
              y: [20, 0],
              opacity: [0, 1]
            }}
            transition={{ 
              duration: 0.3,
              delay: index * 0.1,
              ease: "easeOut"
            }}
            className="inline-block"
          >
            {digit}
          </motion.span>
        ))}
      </div>
    );
  }

  return (
    <motion.span
      key={displayValue}
      initial={{ scale: 1.2, color: "#22c55e" }}
      animate={{ scale: 1, color: "currentColor" }}
      className={className}
    >
      {displayValue.toLocaleString()}
    </motion.span>
  );
};

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isAdmin?: boolean;
}

const DEFAULT_AVATAR = '/avatars/default1.jpg';

interface NavItem {
  id: View;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isAdmin?: boolean;
}

const NavItem = ({ item, isActive, onClick }: { 
  item: NavItem; 
  isActive: boolean; 
  onClick: () => void;
}) => {
  const theme = useTheme();
  const Icon = item.icon;
  
  return (
    <IconButton
      onClick={onClick}
      sx={{
        position: 'relative',
        p: 1.5,
        borderRadius: 2,
        color: isActive ? 'primary.main' : 'text.secondary',
        bgcolor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
        '&:hover': {
          bgcolor: isActive 
            ? alpha(theme.palette.primary.main, 0.2)
            : alpha(theme.palette.action.hover, 0.1),
        },
      }}
    >
      <Badge
        badgeContent={item.badge}
        color="error"
        variant="dot"
        invisible={!item.badge || item.badge <= 0}
        sx={{
          '& .MuiBadge-badge': {
            right: 2,
            top: 2,
          },
        }}
      >
        <Icon className="w-6 h-6" />
      </Badge>
    </IconButton>
  );
};

export default function Navigation({ currentView, onViewChange, isAdmin = false }: NavigationProps) {
  const theme = useTheme();
  const { state } = useGame();
  const { achievements } = useAchievements();
  const [showProfile, setShowProfile] = useState(false);

  const navItems: NavItem[] = [
    { id: '/' as View, label: 'Home', icon: Home },
    { id: '/battle' as View, label: 'Battle', icon: Trophy },
    { id: '/tournament' as View, label: 'Tournament', icon: Trophy },
    { 
      id: '/achievements' as View, 
      label: 'Achievements', 
      icon: Medal,
      badge: achievements?.filter(a => a.ready_to_claim && !a.claimed).length || 0
    },
    { id: '/quests' as View, label: 'Quests', icon: MessageCircle },
    { id: '/shop' as View, label: 'Shop', icon: Store },
    { id: '/inventory' as View, label: 'Inventory', icon: Package },
    { id: '/settings' as View, label: 'Settings', icon: Settings }
  ];

  return (
    <AppBar 
      position="fixed" 
      color="inherit" 
      elevation={0}
      sx={{
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left side - Currency */}
        <Box display="flex" alignItems="center" gap={2}>
          <Chip
            icon={<Coins className="w-4 h-4" />}
            label={state.user?.coins || 0}
            color="warning"
            variant="outlined"
            sx={{ px: 1 }}
          />
          <Chip
            icon={<Gem className="w-4 h-4" />}
            label={state.user?.gems || 0}
            color="secondary"
            variant="outlined"
            sx={{ px: 1 }}
          />
        </Box>

        {/* Center - Navigation */}
        <Box display="flex" alignItems="center" gap={1}>
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={currentView === item.id}
              onClick={() => onViewChange(item.id)}
            />
          ))}
        </Box>

function NavItem({ icon, label, isActive, onClick }: NavItemProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.95 }}
      className={`relative flex flex-col items-center justify-center p-3 rounded-xl ${
        isActive 
          ? 'text-indigo-600 dark:text-indigo-400' 
          : 'text-gray-500 dark:text-gray-400'
      }`}
    >
      <div className="relative">
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute -inset-3 bg-indigo-100/80 dark:bg-indigo-900/30 rounded-xl -z-10"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <motion.div
          animate={isActive ? { 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          } : {}}
          transition={{ duration: 0.5 }}
        >
          {icon}
        </motion.div>
      </div>
      <motion.span 
        className="text-xs mt-1.5"
        animate={isActive ? { 
          scale: 1.05,
          fontWeight: "600"
        } : { 
          scale: 1,
          fontWeight: "400"
        }}
      >
        {label}
      </motion.span>
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute -top-1 w-8 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </motion.button>
  );
}