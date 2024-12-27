import React from 'react';
import { Box, useTheme, alpha } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { BattleCard } from './BattleCard';
import type { Card } from '../../utils/cardUtils';

interface CardDistributionProps {
  playerCards: Card[];
  opponentCardCount: number;
  onComplete: () => void;
}

const CARD_WIDTH = 120;
const CARD_GAP = 20;

export function CardDistribution({ playerCards, opponentCardCount, onComplete }: CardDistributionProps) {
  const theme = useTheme();
  const [isShuffling, setIsShuffling] = React.useState(true);
  const [isDealing, setIsDealing] = React.useState(false);

  // Calculate positions for a centered layout
  const totalWidth = (playerCards.length * CARD_WIDTH) + ((playerCards.length - 1) * CARD_GAP);
  const startX = -(totalWidth / 2) + (CARD_WIDTH / 2);

  const getCardPosition = (index: number) => ({
    x: startX + (index * (CARD_WIDTH + CARD_GAP)),
    y: 0
  });

  // Shuffle animation variants
  const shuffleVariants = {
    initial: { scale: 0.8, y: 0, rotateY: 180 },
    shuffle: (i: number) => ({
      scale: [0.8, 0.9, 0.8],
      rotate: [0, (i % 2 === 0 ? 15 : -15), 0],
      y: [0, -20, 0],
      transition: {
        duration: 0.4,
        repeat: 2,
        delay: i * 0.1
      }
    }),
    deal: (i: number) => ({
      x: getCardPosition(i).x,
      y: i < playerCards.length ? 200 : -200, // Player cards go down, opponent cards go up
      rotateY: i < playerCards.length ? 0 : 180,
      rotate: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: i * 0.1,
        type: 'spring',
        stiffness: 200,
        damping: 20
      }
    })
  };

  React.useEffect(() => {
    // Start with shuffle animation
    const shuffleTimer = setTimeout(() => {
      setIsShuffling(false);
      setIsDealing(true);
    }, 1500); // Shuffle for 1.5 seconds

    // After dealing is complete
    const dealTimer = setTimeout(() => {
      onComplete();
    }, 1500 + ((playerCards.length + opponentCardCount) * 100) + 500);

    return () => {
      clearTimeout(shuffleTimer);
      clearTimeout(dealTimer);
    };
  }, [playerCards.length, opponentCardCount, onComplete]);

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
          width: CARD_WIDTH,
          height: 160,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <AnimatePresence>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`deck-${i}`}
              initial="initial"
              animate={isShuffling ? "shuffle" : isDealing ? "deal" : "initial"}
              variants={shuffleVariants}
              custom={i}
              style={{
                position: 'absolute',
                width: CARD_WIDTH,
                height: 160,
                zIndex: 10 - i
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 2,
                  bgcolor: theme.palette.grey[900],
                  boxShadow: theme.shadows[8],
                  border: '2px solid',
                  borderColor: alpha(theme.palette.common.white, 0.1),
                  background: `linear-gradient(135deg, 
                    ${alpha(theme.palette.primary.dark, 0.9)}, 
                    ${alpha(theme.palette.secondary.dark, 0.9)}
                  )`,
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>

      {/* Dealing animation */}
      {isDealing && (
        <>
          {/* Player Cards */}
          {playerCards.map((card, index) => (
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
                y: 200,
                scale: 1,
                rotateY: 0,
                opacity: 1
              }}
              transition={{
                duration: 0.5,
                delay: index * 0.1 + 1.5,
                type: 'spring',
                stiffness: 200,
                damping: 20
              }}
              style={{ 
                position: 'absolute',
                left: '50%',
                top: '50%',
                transformOrigin: 'center'
              }}
            >
              <BattleCard
                isFlipped={false}
                isWinner={false}
                action={card.action}
                power={card.power}
                effect={card.effect}
              />
            </motion.div>
          ))}

          {/* Opponent Cards */}
          {Array.from({ length: opponentCardCount }).map((_, index) => (
            <motion.div
              key={`opponent-${index}`}
              initial={{ 
                x: 0, 
                y: 0, 
                scale: 0.8, 
                rotateY: 180,
                opacity: 0 
              }}
              animate={{
                x: getCardPosition(index).x,
                y: -200,
                scale: 1,
                rotateY: 180,
                opacity: 1
              }}
              transition={{
                duration: 0.5,
                delay: (index + playerCards.length) * 0.1 + 1.5,
                type: 'spring',
                stiffness: 200,
                damping: 20
              }}
              style={{ 
                position: 'absolute',
                left: '50%',
                top: '50%',
                transformOrigin: 'center'
              }}
            >
              <BattleCard
                isFlipped={true}
                isWinner={false}
                action="attack"
              />
            </motion.div>
          ))}
        </>
      )}
    </Box>
  );
} 