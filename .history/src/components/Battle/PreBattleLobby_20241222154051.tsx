import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, useTheme, alpha } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Crown, Shield, Target } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { Player } from '../../types/battle';
import { BATTLE_CONFIG } from '../../config/battleConfig';
import Button from '../Button';

interface PreBattleLobbyProps {
  onBattleStart: () => void;
  onCancel: () => void;
}

export function PreBattleLobby({ onBattleStart, onCancel }: PreBattleLobbyProps) {
  const theme = useTheme();
  const { state } = useGame();
  const [searchingOpponent, setSearchingOpponent] = useState(false);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [showPreBattle, setShowPreBattle] = useState(false);
  const [countdown, setCountdown] = useState(3);

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
          avatar_url: '/images/avatars/bot.png',
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
  }, [searchingOpponent, state.user]);

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;
    
    if (showPreBattle && countdown > 0) {
      countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            onBattleStart();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [showPreBattle, countdown, onBattleStart]);

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
      justifyContent: 'center',
      gap: 4,
      p: 4
    }}>
      <AnimatePresence mode="wait">
        {!searchingOpponent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            <Button
              variant="primary"
              onClick={handleSearchClick}
              startIcon={<Target />}
              size="large"
            >
              Search for Opponent
            </Button>
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