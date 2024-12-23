import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  useTheme, 
  alpha,
  Grid,
  Chip,
  Divider,
  ButtonGroup
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, 
  Crown, 
  Shield, 
  Target,
  Trophy,
  Coins,
  Star,
  Zap,
  Scale,
  GavelIcon,
  BookOpen,
  Scroll
} from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { Player } from '../../types/battle';
import { BATTLE_CONFIG } from '../../config/battleConfig';
import Button from '../Button';
import { supabase } from '../../lib/supabase';

interface PreBattleLobbyProps {
  onBattleStart: () => void;
  onCancel: () => void;
}

type BattleMode = 'all' | 'constitutional' | 'criminal' | 'civil';

export function PreBattleLobby({ onBattleStart, onCancel }: PreBattleLobbyProps) {
  const theme = useTheme();
  const { state } = useGame();
  const [searchingOpponent, setSearchingOpponent] = useState(false);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [showPreBattle, setShowPreBattle] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [botAvatar, setBotAvatar] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<BattleMode>('all');
  const [userStats, setUserStats] = useState<any>(null);

  // Fetch user stats on mount
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!state.user?.id) return;

      try {
        // Fetch battle stats
        const { data: battleStats, error: battleError } = await supabase
          .from('battle_stats')
          .select('*')
          .eq('user_id', state.user.id)
          .single();

        if (battleError) throw battleError;

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('level, coins, gems, constitutional_score, civil_score, criminal_score')
          .eq('id', state.user.id)
          .single();

        if (profileError) throw profileError;

        setUserStats({ ...battleStats, ...profile });
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    fetchUserStats();
  }, [state.user?.id]);

  // Fetch bot avatar on mount
  useEffect(() => {
    const fetchBotAvatar = async () => {
      try {
        const { data: avatar, error } = await supabase
          .from('avatars')
          .select('url')
          .eq('category', 'bot')
          .single();

        if (error) throw error;
        setBotAvatar(avatar?.url || '/default-avatar.png');
      } catch (error) {
        console.error('Error fetching bot avatar:', error);
        setBotAvatar('/default-avatar.png');
      }
    };

    fetchBotAvatar();
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (searchingOpponent && !opponent) {
      // Simulate searching for 3 seconds before creating a bot opponent
      timeoutId = setTimeout(() => {
        const botOpponent: Player = {
          id: `bot_${Date.now()}`,
          name: generateBotName(),
          rating: state.user?.battle_rating || BATTLE_CONFIG.matchmaking.default_rating,
          level: state.user?.level || 1,
          avatar_url: botAvatar || '/default-avatar.png',
          is_bot: true,
          title: generateBotTitle()
        };
        
        setOpponent(botOpponent);
        setShowPreBattle(true);
      }, 3000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchingOpponent, state.user, botAvatar]);

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;
    
    if (showPreBattle && countdown > 0) {
      countdownInterval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [showPreBattle, countdown]);

  // Separate effect to handle battle start
  useEffect(() => {
    if (countdown === 0 && showPreBattle) {
      // Small delay to ensure smooth transition
      const startTimeout = setTimeout(() => {
        onBattleStart();
      }, 100);
      
      return () => clearTimeout(startTimeout);
    }
  }, [countdown, showPreBattle, onBattleStart]);

  const generateBotName = () => {
    const prefixes = ['Prof.', 'Dr.', 'Mestre', 'Juiz', 'Advogado'];
    const names = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Luiza'];
    const surnames = ['Silva', 'Santos', 'Oliveira', 'Pereira', 'Costa'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    
    return `${prefix} ${name} ${surname}`;
  };

  const generateBotTitle = () => {
    const titles = [
      'Mestre do Direito',
      'Jurista Experiente',
      'Especialista Legal',
      'Doutor em Direito',
      'Constitucionalista'
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  };

  const handleModeSelect = (mode: BattleMode) => {
    setSelectedMode(mode);
  };

  const handleSearchClick = () => {
    setSearchingOpponent(true);
  };

  const handleCancelSearch = () => {
    setSearchingOpponent(false);
    setOpponent(null);
    setShowPreBattle(false);
    setCountdown(3);
    onCancel();
  };

  return (
    <Box sx={{ 
      position: 'relative',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      p: 4
    }}>
      <AnimatePresence mode="wait">
        {!searchingOpponent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full"
          >
            {/* User Stats Section */}
            <Box sx={{ mb: 6 }}>
              <Grid container spacing={3}>
                {/* Profile Info */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 3, 
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 1,
                    textAlign: 'center'
                  }}>
                    <Avatar
                      src={state.user?.avatar_url}
                      sx={{ 
                        width: 80,
                        height: 80,
                        mx: 'auto',
                        mb: 2,
                        border: '4px solid',
                        borderColor: 'primary.main'
                      }}
                    />
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {state.user?.name}
                    </Typography>
                    {state.user?.title && (
                      <Chip
                        icon={<Crown size={16} />}
                        label={state.user.title}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Box>
                </Grid>

                {/* Battle Stats */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 3, 
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 1
                  }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Battle Stats
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Trophy size={24} className="text-primary mx-auto mb-1" />
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {userStats?.wins || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Victories
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Star size={24} className="text-yellow-500 mx-auto mb-1" />
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            Level {userStats?.level || 1}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Current Level
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Zap size={24} className="text-orange-500 mx-auto mb-1" />
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {userStats?.highest_streak || 0}x
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Best Streak
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Coins size={24} className="text-yellow-500 mx-auto mb-1" />
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {userStats?.coins || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Coins
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                {/* Subject Scores */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 3, 
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 1
                  }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Subject Scores
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Constitutional
                        </Typography>
                        <Box sx={{ 
                          width: '100%',
                          height: 8,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          borderRadius: 4,
                          overflow: 'hidden'
                        }}>
                          <Box sx={{ 
                            width: `${userStats?.constitutional_score || 0}%`,
                            height: '100%',
                            bgcolor: 'primary.main'
                          }} />
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Criminal
                        </Typography>
                        <Box sx={{ 
                          width: '100%',
                          height: 8,
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          borderRadius: 4,
                          overflow: 'hidden'
                        }}>
                          <Box sx={{ 
                            width: `${userStats?.criminal_score || 0}%`,
                            height: '100%',
                            bgcolor: 'error.main'
                          }} />
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Civil
                        </Typography>
                        <Box sx={{ 
                          width: '100%',
                          height: 8,
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          borderRadius: 4,
                          overflow: 'hidden'
                        }}>
                          <Box sx={{ 
                            width: `${userStats?.civil_score || 0}%`,
                            height: '100%',
                            bgcolor: 'success.main'
                          }} />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Battle Mode Selection */}
            <Box sx={{ 
              mb: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Select Battle Mode
              </Typography>
              <ButtonGroup variant="outlined" size="large">
                <Button
                  variant={selectedMode === 'all' ? 'primary' : 'ghost'}
                  onClick={() => handleModeSelect('all')}
                  startIcon={<Swords size={18} />}
                >
                  All Subjects
                </Button>
                <Button
                  variant={selectedMode === 'constitutional' ? 'primary' : 'ghost'}
                  onClick={() => handleModeSelect('constitutional')}
                  startIcon={<Scroll size={18} />}
                >
                  Constitutional
                </Button>
                <Button
                  variant={selectedMode === 'criminal' ? 'primary' : 'ghost'}
                  onClick={() => handleModeSelect('criminal')}
                  startIcon={<Scale size={18} />}
                >
                  Criminal
                </Button>
                <Button
                  variant={selectedMode === 'civil' ? 'primary' : 'ghost'}
                  onClick={() => handleModeSelect('civil')}
                  startIcon={<BookOpen size={18} />}
                >
                  Civil
                </Button>
              </ButtonGroup>
            </Box>

            {/* Search Button */}
            <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="primary"
              onClick={handleSearchClick}
              startIcon={<Target />}
              size="large"
            >
              Search for Opponent
            </Button>
            </Box>
          </motion.div>
        )}

        {searchingOpponent && !showPreBattle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <Box sx={{ mb: 4 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Swords size={48} className="text-primary" />
              </motion.div>
              <Typography variant="h5" sx={{ mt: 2 }}>
                Searching for opponent...
              </Typography>
            </Box>
            <Button
              variant="ghost"
              onClick={handleCancelSearch}
            >
              Cancel
            </Button>
          </motion.div>
        )}

        {showPreBattle && opponent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center w-full"
          >
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              mb: 6
            }}>
              {/* Player */}
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  src={state.user?.avatar_url}
                  sx={{ 
                    width: 120,
                    height: 120,
                    border: '4px solid',
                    borderColor: 'primary.main',
                    mb: 2
                  }}
                />
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {state.user?.name}
                </Typography>
                {state.user?.display_title && (
                  <Typography variant="body2" color="text.secondary">
                    {state.user.display_title}
                  </Typography>
                )}
              </Box>

              {/* VS */}
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                px: 4
              }}>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Swords size={48} className="text-primary" />
                </motion.div>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: 'text.secondary'
                  }}
                >
                  VS
                </Typography>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: 'primary.main'
                  }}
                >
                  {countdown}
                </Typography>
              </Box>

              {/* Opponent */}
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  src={opponent.avatar_url}
                  sx={{ 
                    width: 120,
                    height: 120,
                    border: '4px solid',
                    borderColor: 'error.main',
                    mb: 2
                  }}
                />
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {opponent.name}
                </Typography>
                {opponent.title && (
                  <Typography variant="body2" color="text.secondary">
                    {opponent.title}
                  </Typography>
                )}
              </Box>
            </Box>

            <Button
              variant="ghost"
              onClick={handleCancelSearch}
              disabled={countdown <= 1}
            >
              Cancel
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
} 