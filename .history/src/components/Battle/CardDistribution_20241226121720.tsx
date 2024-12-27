import React from 'react';
import { Box, useTheme, alpha, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import type { Card } from '../../utils/cardUtils';
import { useGame } from '../../contexts/GameContext';
import { BattleStateEnum } from '../../types/battle';

export interface CardDistributionProps {
  playerHand: Card[];
  opponentHand: Card[];
  onComplete: () => void;
}

export function CardDistribution({ playerHand, opponentHand, onComplete }: CardDistributionProps) {
  const theme = useTheme();
  const { dispatch } = useGame();
  const [isShuffling, setIsShuffling] = React.useState(true);
  const [isDealing, setIsDealing] = React.useState(false);

  // Calculate positions for a centered layout
  const totalWidth = (playerHand.length * 120);
  const startX = -(totalWidth / 2) + 60;

  const getCardPosition = (index: number) => ({
    x: startX + (index * 120),
    y: 0
  });

  // Enhanced shuffle animation variants
  const shuffleVariants = {
    initial: { 
      scale: 0.8, 
      y: 0, 
      rotateY: 180,
      x: 0,
      rotate: 0
    },
    shuffle: (i: number) => ({
      scale: [0.8, 0.85, 0.8],
      rotate: [0, (i % 3 - 1) * 15, 0],
      x: [(i % 3 - 1) * 20, 0, (i % 3 - 1) * -20],
      y: [0, -30 + i * 5, 0],
      transition: {
        duration: 0.8,
        repeat: 2,
        ease: "easeInOut"
      }
    }),
    deal: (i: number) => ({
      x: getCardPosition(i).x,
      y: i < playerHand.length ? 300 : -300,
      rotateY: i < playerHand.length ? 0 : 180,
      rotate: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        delay: i * 0.15,
        type: 'spring',
        stiffness: 150,
        damping: 12
      }
    })
  };

  React.useEffect(() => {
    // Start with shuffle animation
    const shuffleTimer = setTimeout(() => {
      setIsShuffling(false);
      setIsDealing(true);
    }, 2400); // Longer shuffle animation

    // After dealing is complete
    const dealTimer = setTimeout(() => {
      dispatch({ type: 'SET_BATTLE_PHASE', payload: BattleStateEnum.CARD_SELECTION });
      onComplete();
    }, 2400 + ((playerHand.length + opponentHand.length) * 150) + 500);

    return () => {
      clearTimeout(shuffleTimer);
      clearTimeout(dealTimer);
    };
  }, [playerHand.length, opponentHand.length, onComplete, dispatch]);

  // Create a stack of cards for shuffling
  const shuffleStack = [...Array(7)].map((_, i) => ({ 
    id: `shuffle-${i}`, 
    zIndex: 7 - i,
    offset: i * 2
  }));

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        perspective: 1000,
        bgcolor: alpha(theme.palette.background.paper, 0.9)
      }}
    >
      {/* Deck pile with shuffle animation */}
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 120,
          height: 160,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <AnimatePresence>
          {shuffleStack.map(({ id, zIndex, offset }) => (
            <motion.div
              key={id}
              initial="initial"
              animate={isShuffling ? "shuffle" : isDealing ? "deal" : "initial"}
              variants={shuffleVariants}
              custom={zIndex}
              style={{
                position: 'absolute',
                width: 120,
                height: 160,
                zIndex,
                y: offset
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 2,
                  bgcolor: theme.palette.primary.dark,
                  boxShadow: theme.shadows[8],
                  border: '2px solid',
                  borderColor: alpha(theme.palette.primary.light, 0.3),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    color: alpha(theme.palette.primary.light, 0.5),
                    fontWeight: 'bold',
                    userSelect: 'none'
                  }}
                >
                  ?
                </Typography>
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>

      {/* Dealing animation */}
      {isDealing && (
        <>
          {/* Player Cards */}
          {playerHand.map((card, index) => (
            <motion.div
              key={`player-${card.id}`}
              initial={{ 
                x: 0, 
                y: 0, 
                scale: 0.8, 
                rotateY: 180,
                opacity: 0 
              }}
              animate={{
                x: getCardPosition(index).x,
                y: 300,
                scale: 1,
                rotateY: 0,
                opacity: 1,
                zIndex: index
              }}
              transition={{
                duration: 0.8,
                delay: index * 0.15 + 0.1,
                type: 'spring',
                stiffness: 150,
                damping: 12
              }}
              style={{ 
                position: 'absolute',
                left: '50%',
                top: '50%',
                transformOrigin: 'center'
              }}
            >
              <Box
                sx={{
                  width: 120,
                  height: 160,
                  borderRadius: 2,
                  bgcolor: theme.palette.primary.dark,
                  boxShadow: theme.shadows[8],
                  border: '2px solid',
                  borderColor: alpha(theme.palette.primary.light, 0.3),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    color: alpha(theme.palette.primary.light, 0.5),
                    fontWeight: 'bold',
                    userSelect: 'none'
                  }}
                >
                  ?
                </Typography>
              </Box>
            </motion.div>
          ))}

          {/* Opponent Cards */}
          {opponentHand.map((card, index) => (
            <motion.div
              key={`opponent-${card.id}`}
              initial={{ 
                x: 0, 
                y: 0, 
                scale: 0.8, 
                rotateY: 180,
                opacity: 0 
              }}
              animate={{
                x: getCardPosition(index).x,
                y: -300,
                scale: 1,
                rotateY: 180,
                opacity: 1,
                zIndex: index
              }}
              transition={{
                duration: 0.8,
                delay: (index + playerHand.length) * 0.15 + 0.1,
                type: 'spring',
                stiffness: 150,
                damping: 12
              }}
              style={{ 
                position: 'absolute',
                left: '50%',
                top: '50%',
                transformOrigin: 'center'
              }}
            >
              <Box
                sx={{
                  width: 120,
                  height: 160,
                  borderRadius: 2,
                  bgcolor: theme.palette.primary.dark,
                  boxShadow: theme.shadows[8],
                  border: '2px solid',
                  borderColor: alpha(theme.palette.primary.light, 0.3),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    color: alpha(theme.palette.primary.light, 0.5),
                    fontWeight: 'bold',
                    userSelect: 'none'
                  }}
                >
                  ?
                </Typography>
              </Box>
            </motion.div>
          ))}
        </>
      )}
    </Box>
  );
} 