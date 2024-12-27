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

export default function Navigation({ currentView, onViewChange, isAdmin = false }: NavigationProps) {
  const { state, dispatch } = useGame();
  const { achievements } = useAchievements();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileContentRef = useRef<HTMLDivElement>(null);
  const [showGainAnimation, setShowGainAnimation] = useState(false);
  const [recentGain, setRecentGain] = useState({ coins: 0, gems: 0 });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!state.user?.id) return;

    const userSubscription = supabase
      .channel('user_currency_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${state.user.id}`,
        },
        (payload) => {
          const newData = payload.new;
          const oldData = state.user;
          
          if (!oldData) return;

          // Calculate gains
          const coinsGain = newData.coins - oldData.coins;
          const gemsGain = (newData.gems || 0) - (oldData.gems || 0);
          
          if (coinsGain > 0 || gemsGain > 0) {
            setRecentGain({ coins: coinsGain, gems: gemsGain });
            setShowGainAnimation(true);
            
            // Hide gain animation after 2 seconds
            setTimeout(() => setShowGainAnimation(false), 2000);
          }
          
          // Update game state with new values
          dispatch({
            type: 'UPDATE_USER_PROFILE',
            payload: newData
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userSubscription);
    };
  }, [state.user?.id, dispatch]);

  // Close profile when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && 
          profileContentRef.current &&
          !profileRef.current.contains(event.target as Node) &&
          !profileContentRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    }

    if (showProfile) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfile]);

  // Memoize profile content to prevent unnecessary re-renders
  const profileContent = useMemo(() => (
    <AnimatePresence mode="wait">
      {showProfile && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
            onClick={() => setShowProfile(false)}
          />
          <motion.div
            ref={profileContentRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 flex items-center justify-center z-[100] p-4 mt-20"
          >
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl">
              <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
                <div className="sticky top-0 z-[101] flex justify-end p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => setShowProfile(false)}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <ProfileDashboard />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  ), [showProfile]);

  // Handle body scroll lock
  useEffect(() => {
    if (showProfile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showProfile]);

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