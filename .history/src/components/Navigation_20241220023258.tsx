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

const DEFAULT_AVATAR = '/avatars/default1.jpg';

interface NavItem {
  id: View;
  label: string;
  icon: LucideIcon;
  badge?: number;
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

        {/* Right side - Profile */}
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            onClick={() => setShowProfile(!showProfile)}
            startIcon={
              <Avatar
                src={state.user?.avatar_url || DEFAULT_AVATAR}
                alt={state.user?.name || 'User'}
                sx={{ width: 32, height: 32 }}
              />
            }
            endIcon={<ChevronDown className="w-4 h-4" />}
            sx={{
              textTransform: 'none',
              color: 'text.primary',
              '&:hover': {
                bgcolor: alpha(theme.palette.action.hover, 0.1),
              },
            }}
          >
            <Box sx={{ ml: 1, textAlign: 'left' }}>
              <Typography variant="subtitle2">
                {state.user?.name || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Level {state.user?.level || 1}
              </Typography>
            </Box>
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}