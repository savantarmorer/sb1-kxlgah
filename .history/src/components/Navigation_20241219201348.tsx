import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Store, Home, Package, 
  Settings, Mail, MessageCircle,
  Gem, Coins, ChevronDown, X, Medal
} from 'lucide-react';
import { View } from '../types/navigation';
import { useGame } from '../contexts/GameContext';
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

export default function Navigation({ currentView, onViewChange, isAdmin = false }: NavigationProps) {
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

  const navItems = [
    { id: '/' as View, label: 'Home', icon: Home },
    { id: '/battle' as View, label: 'Battle', icon: Trophy },
    { id: '/tournament' as View, label: 'Tournament', icon: Trophy },
    { id: '/achievements' as View, label: 'Achievements', icon: Medal },
    { id: '/quests' as View, label: 'Quests', icon: MessageCircle },
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
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50 backdrop-blur-lg z-50 shadow-sm h-20"
      >
        <div className="max-w-7xl mx-auto px-6 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Currency Display - Left */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-6"
            >
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="relative flex items-center space-x-2 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-full"
              >
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                  <SlotMachineCounter value={state.user?.coins || 0} />
                </span>
                <AnimatePresence>
                  {showGainAnimation && recentGain.coins > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: -20 }}
                      exit={{ opacity: 0 }}
                      className="absolute -top-2 right-0 text-green-500 font-bold text-sm"
                    >
                      +{recentGain.coins}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="relative flex items-center space-x-2 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-full"
              >
                <Gem className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  <SlotMachineCounter value={state.user?.gems || 0} />
                </span>
                <AnimatePresence>
                  {showGainAnimation && recentGain.gems > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: -20 }}
                      exit={{ opacity: 0 }}
                      className="absolute -top-2 right-0 text-green-500 font-bold text-sm"
                    >
                      +{recentGain.gems}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>

            {/* User Info - Center */}
            <motion.div 
              ref={profileRef}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            >
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <motion.div
                  className="relative group cursor-pointer"
                  whileHover="hover"
                  onClick={() => {
                    setShowProfile(!showProfile);
                    document.body.style.overflow = !showProfile ? 'hidden' : '';
                  }}
                >
                  <motion.div
                    className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-200"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  />
                  <img 
                    src={state.user?.avatar_url || DEFAULT_AVATAR}
                    alt={state.user?.name || 'User'}
                    className="relative w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-800"
                    onError={handleAvatarError}
                  />
                  <motion.div 
                    className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-gray-400"
                    animate={{ y: showProfile ? 2 : -2 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </motion.div>
              </motion.div>
              <motion.div 
                className="text-center mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {state.user?.name || 'User'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Level {state.user?.level || 1} • {state.user?.display_title || 'Adventurer'}
                </p>
              </motion.div>
            </motion.div>

            {/* Communication Icons - Right */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: -15 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Profile Dashboard Modal */}
      {profileContent}

      {/* Bottom Navigation */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", bounce: 0.2 }}
        className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 border-t border-gray-200/50 dark:border-gray-800/50 backdrop-blur-lg z-50"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-around h-20">
            {navItems.map((item) => (
              <NavItem
                key={item.id}
                icon={<item.icon />}
                label={item.label}
                isActive={currentView === item.id}
                onClick={() => onViewChange(item.id)}
              />
            ))}
          </div>
        </div>
      </motion.nav>
    </>
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