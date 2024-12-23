import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  IconButton, 
  Typography, 
  Menu, 
  MenuItem, 
  Container,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu as MenuIcon, 
  User, 
  LogOut, 
  Settings, 
  Package, 
  Sword, 
  Crown,
  ChevronDown,
  type LucideIcon
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { supabase } from '../lib/supabase';
import Button from './Button';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User as GameUser } from '../types/user';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: 'Inventory', path: '/inventory', icon: Package },
  { label: 'Battle', path: '/battle', icon: Sword }
];

interface NavigationProps {
  currentView?: string;
  onViewChange?: (view: string) => void;
  isAdmin?: boolean;
}

interface DisplayTitle {
  name: string;
  rarity: string;
}

interface UserDisplayTitle {
  title_id: number;
  is_equipped: boolean;
  display_titles: DisplayTitle;
}

interface TitleData {
  title_id: number;
  is_equipped: boolean;
  display_titles: DisplayTitle;
}

export default function Navigation({ currentView, onViewChange, isAdmin }: NavigationProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useGame();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userTitle, setUserTitle] = useState<string | null>(null);
  const [userTitleRarity, setUserTitleRarity] = useState<string | null>(null);

  useEffect(() => {
    if (state.user) {
      fetchUserTitle();
    }
  }, [state.user]);

  const fetchUserTitle = async () => {
    if (!state.user) return;
    try {
      const { data: titleData, error } = await supabase
        .from('user_display_titles')
        .select(`
          title_id,
          is_equipped,
          display_titles (
            name,
            rarity
          )
        `)
        .eq('user_id', state.user.id)
        .eq('is_equipped', true)
        .single();

      if (error) throw error;

      const rawData = titleData as any;
      if (rawData && 
          typeof rawData.title_id === 'number' && 
          typeof rawData.is_equipped === 'boolean' && 
          rawData.display_titles && 
          typeof rawData.display_titles.name === 'string' && 
          typeof rawData.display_titles.rarity === 'string') {
        setUserTitle(rawData.display_titles.name);
        setUserTitleRarity(rawData.display_titles.rarity);
      } else {
        setUserTitle('Adventurer');
        setUserTitleRarity('common');
      }
    } catch (error) {
      console.error('Error fetching user title:', error);
      setUserTitle('Adventurer');
      setUserTitleRarity('common');
    }
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      dispatch({ type: 'RESET_BATTLE' });
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleNavigate = (path: string) => {
    if (onViewChange) {
      onViewChange(path);
    } else {
      navigate(path);
    }
    handleClose();
  };

  const user = state.user ? (state.user as any as SupabaseUser) : null;

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ gap: 2 }}>
          {/* Logo */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer'
          }} onClick={() => handleNavigate('/')}>
            <Crown size={32} className="text-indigo-500" />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(45deg, primary.main, secondary.main)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'none', md: 'flex' }
              }}
            >
              GAME
            </Typography>
          </Box>

          {/* Navigation Items */}
          <Box sx={{ 
            display: { xs: 'none', md: 'flex' },
            gap: 1,
            ml: 4,
            flex: 1
          }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? "primary" : "ghost"}
                onClick={() => handleNavigate(item.path)}
                startIcon={<item.icon size={18} />}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* Mobile Menu */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flex: 1 }}>
            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              sx={{
                '& .MuiPaper-root': {
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  boxShadow: theme.shadows[4],
                  border: '1px solid',
                  borderColor: 'divider',
                  mt: 1
                }
              }}
            >
              {navItems.map((item) => (
                <MenuItem 
                  key={item.path} 
                  onClick={() => handleNavigate(item.path)}
                  selected={location.pathname === item.path}
                  sx={{
                    gap: 2,
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5
                  }}
                >
                  <item.icon size={18} />
                  <Typography>{item.label}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* User Section */}
          {user ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 2
            }}>
              {/* User Title */}
              <Box 
                component={motion.div}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                sx={{ 
                  display: { xs: 'none', sm: 'flex' },
                  alignItems: 'center',
                  gap: 1,
                  py: 0.5,
                  px: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.2)
                }}
              >
                <Crown size={16} className="text-indigo-400" />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'medium',
                    color: 'primary.main'
                  }}
                >
                  {userTitle}
                </Typography>
              </Box>

              {/* User Menu */}
              <Box>
                <Button
                  variant="ghost"
                  onClick={handleMenu}
                  startIcon={
                    user.user_metadata?.avatar_url ? (
                      <Avatar 
                        src={user.user_metadata.avatar_url} 
                        sx={{ width: 24, height: 24 }}
                      />
                    ) : (
                      <User size={18} />
                    )
                  }
                  endIcon={<ChevronDown size={16} />}
                >
                  <Typography 
                    sx={{ 
                      display: { xs: 'none', sm: 'block' },
                      fontWeight: 'medium'
                    }}
                  >
                    {user.user_metadata?.username || 'User'}
                  </Typography>
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  sx={{
                    '& .MuiPaper-root': {
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                      boxShadow: theme.shadows[4],
                      border: '1px solid',
                      borderColor: 'divider',
                      mt: 1,
                      minWidth: 200
                    }
                  }}
                >
                  <MenuItem 
                    onClick={() => handleNavigate('/profile')}
                    sx={{ gap: 2, borderRadius: 1, mx: 1, my: 0.5 }}
                  >
                    <User size={18} />
                    <Typography>Profile</Typography>
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleNavigate('/settings')}
                    sx={{ gap: 2, borderRadius: 1, mx: 1, my: 0.5 }}
                  >
                    <Settings size={18} />
                    <Typography>Settings</Typography>
                  </MenuItem>
                  <Box sx={{ 
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    my: 1
                  }} />
                  <MenuItem 
                    onClick={handleLogout}
                    sx={{ 
                      gap: 2,
                      borderRadius: 1,
                      mx: 1,
                      my: 0.5,
                      color: 'error.main'
                    }}
                  >
                    <LogOut size={18} />
                    <Typography>Logout</Typography>
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
          ) : (
            <Button
              variant="primary"
              onClick={() => navigate('/login')}
              startIcon={<User size={18} />}
            >
              Login
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}