import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Store, Home, Package, 
  Settings, Mail, MessageCircle,
  Gem, Coins, ChevronDown, Sun, Moon
} from 'lucide-react';
import { Box, IconButton, Stack, Typography, Avatar, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { View } from '../types/navigation';
import { useGame } from '../contexts/GameContext';
import ProfileDashboard from './profile/ProfileDashboard';
import { supabase } from '../lib/supabase';
import type { AppTheme } from '../theme';
import { styles } from '../theme';
import { useThemeContext } from '../theme/ThemeProvider';
import { typography } from '../theme/tokens/typography';

// Slot machine style animated counter
const SlotMachineCounter = ({ value, className }: { value: number, className?: string }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValue = useRef(value);
  const theme = useTheme<AppTheme>();

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
      <Stack direction="row" className={className} sx={{ overflow: 'hidden' }}>
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
            style={{ display: 'inline-block' }}
          >
            {digit}
          </motion.span>
        ))}
      </Stack>
    );
  }

  return (
    <motion.span
      key={displayValue}
      initial={{ scale: 1.2, color: theme.colors.semantic.success.main }}
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

export default function Navigation({ currentView, onViewChange, isAdmin = false }: NavigationProps) {
  const theme = useTheme<AppTheme>();
  const { mode, toggleColorMode } = useThemeContext();
  const { state, dispatch } = useGame();
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
    showProfile && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setShowProfile(false)}
        />
        <motion.div
          ref={profileContentRef}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-x-0 top-20 mx-auto w-full max-w-3xl px-4 z-50"
          style={{ maxHeight: 'calc(100vh - 5rem)', overflowY: 'auto' }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
            <ProfileDashboard />
          </div>
        </motion.div>
      </>
    )
  ), [showProfile]);

  // Remove body scroll lock
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const navItems = [
    { id: '/' as View, label: 'Home', icon: Home },
    { id: '/battle' as View, label: 'Battle', icon: Trophy },
    { id: '/tournament' as View, label: 'Tournament', icon: Trophy },
    { id: '/shop' as View, label: 'Shop', icon: Store },
    { id: '/inventory' as View, label: 'Inventory', icon: Package },
    { id: '/settings' as View, label: 'Settings', icon: Settings }
  ];

  const handleAvatarError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    if (img.src !== DEFAULT_AVATAR) {
      img.src = DEFAULT_AVATAR;
    }
  }, []);

  return (
    <>
      {/* Top Bar */}
      <Box
        component={motion.div}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 80,
          zIndex: 50,
          borderBottom: theme.styles.border.light,
          ...theme.styles.effects.glassmorphismDark,
        }}
      >
        <Box sx={{ 
          maxWidth: '1280px',
          mx: 'auto',
          px: theme.spacing(3),
          height: '100%',
        }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ height: '100%' }}
          >
            {/* Currency Display - Left */}
            <Stack
              component={motion.div}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              direction="row"
              spacing={3}
            >
              <Box
                component={motion.div}
                whileHover={{ scale: 1.05 }}
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: 'full',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  border: theme.styles.border.light,
                }}
              >
                <Coins className="w-5 h-5 text-yellow-500" />
                <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                  <SlotMachineCounter value={state.user?.coins || 0} />
                </Typography>
                <AnimatePresence>
                  {showGainAnimation && recentGain.coins > 0 && (
                    <Box
                      component={motion.div}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: -20 }}
                      exit={{ opacity: 0 }}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: 0,
                        color: theme.colors.semantic.success.main,
                        fontWeight: 'bold',
                        fontSize: theme.typography.size.sm,
                      }}
                    >
                      +{recentGain.coins}
                    </Box>
                  )}
                </AnimatePresence>
              </Box>

              <Box
                component={motion.div}
                whileHover={{ scale: 1.05 }}
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: 'full',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  border: theme.styles.border.light,
                }}
              >
                <Gem className="w-5 h-5 text-purple-500" />
                <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                  <SlotMachineCounter value={state.user?.gems || 0} />
                </Typography>
                <AnimatePresence>
                  {showGainAnimation && recentGain.gems > 0 && (
                    <Box
                      component={motion.div}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: -20 }}
                      exit={{ opacity: 0 }}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: 0,
                        color: theme.colors.semantic.success.main,
                        fontWeight: 'bold',
                        fontSize: theme.typography.size.sm,
                      }}
                    >
                      +{recentGain.gems}
                    </Box>
                  )}
                </AnimatePresence>
              </Box>
            </Stack>

            {/* User Menu - Right */}
            <Stack direction="row" spacing={2}>
              <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
                <IconButton 
                  onClick={toggleColorMode}
                  sx={{ 
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </IconButton>
              </Tooltip>
              <IconButton sx={{ color: 'white' }}>
                <Mail />
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <MessageCircle />
              </IconButton>
              
              <Box ref={profileRef} sx={{ position: 'relative' }}>
                <Box
                  component={motion.div}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowProfile(!showProfile)}
                  sx={{ 
                    position: 'relative',
                    cursor: 'pointer',
                    ...theme.styles.effects.hoverGlow(theme.colors.brand.primary[500]),
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: -1,
                      background: theme.gradients.brand.primary,
                      borderRadius: '9999px',
                      opacity: 0.4,
                      filter: 'blur(8px)',
                      transition: 'opacity 0.2s',
                      '&:hover': {
                        opacity: 0.75,
                      },
                    }}
                  />
                  <Avatar
                    src={state.user?.avatar_url || DEFAULT_AVATAR}
                    onError={handleAvatarError}
                    sx={{
                      width: 48,
                      height: 48,
                      border: 2,
                      borderColor: 'white',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      width: 16,
                      height: 16,
                      bgcolor: theme.colors.semantic.success.main,
                      borderRadius: '50%',
                      border: 2,
                      borderColor: 'white',
                    }}
                  />
                </Box>
              </Box>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* Profile Modal */}
      <AnimatePresence>
        {profileContent}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: theme.styles.border.light,
          ...theme.styles.effects.glassmorphismDark,
          zIndex: 50,
        }}
      >
        <Box sx={{ 
          maxWidth: '1280px',
          mx: 'auto',
          px: theme.spacing(3),
        }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-around"
            sx={{ height: 80 }}
          >
            {navItems.map(({ id, label, icon: Icon }) => {
              const isActive = currentView === id;
              return (
                <Box
                  key={id}
                  onClick={() => onViewChange(id)}
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 1.5,
                    borderRadius: 3,
                    cursor: 'pointer',
                    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.6)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      color: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  {isActive && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -4,
                        width: 32,
                        height: 4,
                        bgcolor: theme.colors.brand.primary[400],
                        borderRadius: 'full',
                      }}
                    />
                  )}
                  <Icon size={20} />
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 0.75,
                      fontSize: typography.size.xs,
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Box>
    </>
  );
}