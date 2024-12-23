import React from 'react';
import { Box, Typography, Avatar, useTheme, alpha } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface BattleAnimationProps {
  attacker: 'player' | 'opponent';
  damage: number;
  playerAvatar?: string;
  opponentAvatar: string;
  shieldBlock?: number;
  shieldBreak?: number;
}

export function BattleAnimation({ 
  attacker, 
  damage, 
  playerAvatar, 
  opponentAvatar,
  shieldBlock,
  shieldBreak
}: BattleAnimationProps) {
  const theme = useTheme();

  const attackerAvatar = attacker === 'player' ? playerAvatar : opponentAvatar;
  const defenderAvatar = attacker === 'player' ? opponentAvatar : playerAvatar;
  const attackerColor = attacker === 'player' ? theme.palette.primary.main : theme.palette.error.main;

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: alpha(theme.palette.background.paper, 0.9),
        zIndex: 10
      }}
    >
      <Box sx={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Attacker */}
        <motion.div
          initial={{ x: attacker === 'player' ? -100 : 100 }}
          animate={[
            { x: 0, transition: { duration: 0.3 } },
            { x: attacker === 'player' ? 200 : -200, transition: { duration: 0.5, delay: 0.3 } },
            { x: attacker === 'player' ? -100 : 100, transition: { duration: 0.3, delay: 0.8 } }
          ]}
        >
          <Avatar
            src={attackerAvatar}
            sx={{ 
              width: 100,
              height: 100,
              border: '4px solid',
              borderColor: attackerColor
            }}
          />
        </motion.div>

        {/* Damage Numbers */}
        <Box sx={{ position: 'relative' }}>
          {shieldBlock ? (
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -20 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Typography 
                variant="h4" 
                sx={{ 
                  color: 'info.main',
                  fontWeight: 'bold',
                  textShadow: '0 0 10px currentColor'
                }}
              >
                Shield Block: {shieldBlock}
              </Typography>
            </motion.div>
          ) : null}

          {shieldBreak ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 1 }}
            >
              <Typography 
                variant="h4" 
                sx={{ 
                  color: 'warning.main',
                  fontWeight: 'bold',
                  textShadow: '0 0 10px currentColor'
                }}
              >
                Shield Break!
              </Typography>
            </motion.div>
          ) : null}

          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: damage > 0 ? -40 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            <Typography 
              variant="h3" 
              sx={{ 
                color: damage > 0 ? 'error.main' : 'text.secondary',
                fontWeight: 'bold',
                textShadow: '0 0 10px currentColor'
              }}
            >
              {damage > 0 ? `-${damage} HP` : 'No Damage'}
            </Typography>
          </motion.div>
        </Box>

        {/* Defender */}
        <motion.div
          initial={{ x: attacker === 'player' ? 100 : -100 }}
          animate={[
            { x: 0, transition: { duration: 0.3 } },
            { 
              x: [0, attacker === 'player' ? 20 : -20, 0],
              transition: { duration: 0.2, delay: 0.8 }
            }
          ]}
        >
          <Avatar
            src={defenderAvatar}
            sx={{ 
              width: 100,
              height: 100,
              border: '4px solid',
              borderColor: attacker === 'player' ? theme.palette.error.main : theme.palette.primary.main
            }}
          />
        </motion.div>
      </Box>
    </Box>
  );
} 