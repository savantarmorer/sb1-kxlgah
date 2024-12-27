import React from 'react';
import { Box, Typography, Avatar, useTheme, alpha } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap } from 'lucide-react';

interface BattleAnimationProps {
  attacker: 'player' | 'opponent';
  damage: number;
  playerAvatar?: string;
  opponentAvatar: string;
  shieldBlock?: number;
  shieldBreak?: number;
}

const ParticleExplosion = ({ color }: { color: string }) => {
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    return {
      x: Math.cos(angle) * 100,
      y: Math.sin(angle) * 100,
      scale: Math.random() * 0.5 + 0.5,
      rotation: Math.random() * 360
    };
  });

  return (
    <Box sx={{ position: 'absolute', inset: 0 }}>
      {particles.map((particle, i) => (
        <Box
          key={i}
          component={motion.div}
          initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 0 }}
          animate={{
            x: particle.x,
            y: particle.y,
            scale: particle.scale,
            rotate: particle.rotation,
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 0.6,
            delay: 0.7,
            ease: 'easeOut'
          }}
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 20,
            height: 4,
            bgcolor: color,
            borderRadius: 2,
            boxShadow: `0 0 10px ${color}`,
            transformOrigin: 'center'
          }}
        />
      ))}
    </Box>
  );
};

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
  const defenderColor = attacker === 'player' ? theme.palette.error.main : theme.palette.primary.main;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: alpha(theme.palette.background.paper, 0.95),
        backdropFilter: 'blur(8px)',
        zIndex: 10,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ display: 'flex', gap: 12, alignItems: 'center', position: 'relative' }}>
        {/* Battle Background Effects */}
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          sx={{
            position: 'absolute',
            inset: -100,
            background: `radial-gradient(circle at center, ${alpha(attackerColor, 0.3)} 0%, transparent 70%)`,
            zIndex: 0
          }}
        />

        {/* Attacker */}
        <motion.div
          initial={{ x: attacker === 'player' ? -200 : 200, opacity: 0 }}
          animate={[
            { x: 0, opacity: 1, transition: { duration: 0.3 } },
            { 
              x: attacker === 'player' ? 300 : -300,
              scale: 1.5,
              rotate: attacker === 'player' ? 720 : -720,
              transition: { 
                duration: 0.4, 
                delay: 0.3,
                type: 'spring',
                stiffness: 200
              }
            },
            { 
              x: attacker === 'player' ? -200 : 200,
              scale: 1,
              rotate: 0,
              transition: { 
                duration: 0.3, 
                delay: 0.7,
                type: 'spring'
              }
            }
          ]}
        >
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={attackerAvatar}
              sx={{ 
                width: 120,
                height: 120,
                border: '4px solid',
                borderColor: attackerColor,
                boxShadow: `0 0 20px ${alpha(attackerColor, 0.5)}`
              }}
            />
            {/* Attack Energy Effect */}
            <Box
              component={motion.div}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.8, 0, 0.8],
              }}
              transition={{ duration: 0.3, repeat: Infinity }}
              sx={{
                position: 'absolute',
                inset: -10,
                borderRadius: '50%',
                border: `3px solid ${attackerColor}`,
                boxShadow: `0 0 20px ${alpha(attackerColor, 0.5)}`
              }}
            />
            {/* Speed Lines */}
            {Array.from({ length: 8 }).map((_, i) => (
              <Box
                key={i}
                component={motion.div}
                initial={{ opacity: 0, x: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  x: attacker === 'player' ? [-50, 50] : [50, -50]
                }}
                transition={{
                  duration: 0.2,
                  delay: 0.3 + (i * 0.02),
                  ease: 'linear'
                }}
                sx={{
                  position: 'absolute',
                  top: 20 + (i * 10),
                  left: attacker === 'player' ? -20 : 'auto',
                  right: attacker === 'player' ? 'auto' : -20,
                  width: 40,
                  height: 2,
                  bgcolor: attackerColor,
                  boxShadow: `0 0 5px ${attackerColor}`,
                  borderRadius: 'full'
                }}
              />
            ))}
          </Box>
        </motion.div>

        {/* Battle Effects */}
        <Box sx={{ position: 'relative', minWidth: 200, textAlign: 'center' }}>
          {/* Shield Block Effect */}
          <AnimatePresence>
            {shieldBlock && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 0 }}
                animate={{ opacity: 1, scale: 1, y: -40 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.4, delay: 0.7 }}
              >
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  mb: 2
                }}>
                  <Shield 
                    size={32}
                    className="text-info"
                    style={{ filter: 'drop-shadow(0 0 10px currentColor)' }}
                  />
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: 'info.main',
                      fontWeight: 'bold',
                      textShadow: '0 0 10px currentColor'
                    }}
                  >
                    {shieldBlock}
                  </Typography>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shield Break Effect */}
          <AnimatePresence>
            {shieldBreak && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: 1, 
                  scale: [1, 1.2, 1],
                  rotate: [-5, 5, -5, 5, 0]
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  mb: 2
                }}>
                  <Shield 
                    size={32}
                    className="text-warning"
                    style={{ 
                      filter: 'drop-shadow(0 0 10px currentColor)',
                      transform: 'rotate(45deg)'
                    }}
                  />
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: 'warning.main',
                      fontWeight: 'bold',
                      textShadow: '0 0 10px currentColor'
                    }}
                  >
                    Break!
                  </Typography>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Damage Number */}
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ 
              opacity: 1, 
              y: damage > 0 ? -60 : 0,
              scale: [1, 1.5, 1]
            }}
            transition={{ 
              duration: 0.6,
              delay: 0.9,
              scale: { duration: 0.3 }
            }}
          >
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}>
              <Zap 
                size={40}
                className={damage > 0 ? "text-error" : "text-gray"}
                style={{ filter: 'drop-shadow(0 0 10px currentColor)' }}
              />
              <Typography 
                variant="h2" 
                sx={{ 
                  color: damage > 0 ? 'error.main' : 'text.secondary',
                  fontWeight: 900,
                  textShadow: '0 0 20px currentColor',
                  fontFamily: 'monospace'
                }}
              >
                {damage > 0 ? `-${damage}` : '0'}
              </Typography>
            </Box>
          </motion.div>
        </Box>

        {/* Defender */}
        <motion.div
          initial={{ x: attacker === 'player' ? 200 : -200, opacity: 0 }}
          animate={[
            { x: 0, opacity: 1, transition: { duration: 0.3 } },
            { 
              x: [0, attacker === 'player' ? 50 : -50, 0],
              y: [0, -30, 0],
              rotate: [0, attacker === 'player' ? 15 : -15, 0],
              scale: [1, 0.9, 1],
              transition: { 
                duration: 0.4, 
                delay: 0.7,
                type: 'spring',
                stiffness: 300,
                damping: 10
              }
            }
          ]}
        >
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={defenderAvatar}
              sx={{ 
                width: 120,
                height: 120,
                border: '4px solid',
                borderColor: defenderColor,
                boxShadow: `0 0 20px ${alpha(defenderColor, 0.5)}`
              }}
            />
            {/* Hit Effect */}
            {damage > 0 && (
              <>
                <Box
                  component={motion.div}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0, 0.8, 0],
                    scale: [1, 2, 1]
                  }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                  sx={{
                    position: 'absolute',
                    inset: -20,
                    borderRadius: '50%',
                    background: `radial-gradient(circle at center, ${alpha(theme.palette.error.main, 0.4)} 0%, transparent 70%)`
                  }}
                />
                <ParticleExplosion color={theme.palette.error.main} />
              </>
            )}
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
} 