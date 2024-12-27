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

const deckPosition = { x: '50%', y: '50%' };
const playerHandPosition = { y: '80%' };
const opponentHandPosition = { y: '20%' };

const cardVariants = {
  deck: {
    x: deckPosition.x,
    y: deckPosition.y,
    rotateY: 180,
    scale: 0.8,
  },
  playerHand: (index: number) => ({
    x: `${(index - 3) * 120}px`,
    y: playerHandPosition.y,
    rotateY: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: index * 0.1,
      type: 'spring',
      stiffness: 200,
      damping: 20
    }
  }),
  opponentHand: (index: number) => ({
    x: `${(index - 3) * 120}px`,
    y: opponentHandPosition.y,
    rotateY: 180,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: index * 0.1 + 0.5,
      type: 'spring',
      stiffness: 200,
      damping: 20
    }
  })
};

export function CardDistribution({ playerCards, opponentCardCount, onComplete }: CardDistributionProps) {
  const theme = useTheme();
  const [isDistributing, setIsDistributing] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsDistributing(false);
      onComplete();
    }, (playerCards.length + opponentCardCount) * 100 + 1000);

    return () => clearTimeout(timer);
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
      {/* Deck */}
      <Box
        component={motion.div}
        initial={false}
        animate={{
          scale: isDistributing ? 1 : 0.8,
          opacity: isDistributing ? 1 : 0
        }}
        sx={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <Box
          sx={{
            width: 120,
            height: 160,
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
      </Box>

      {/* Player Cards */}
      <AnimatePresence>
        {playerCards.map((card, index) => (
          <motion.div
            key={`player-${card.id}`}
            initial="deck"
            animate={isDistributing ? "playerHand" : undefined}
            variants={cardVariants}
            custom={index}
            style={{ position: 'absolute', transformOrigin: 'center' }}
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
      </AnimatePresence>

      {/* Opponent Cards */}
      <AnimatePresence>
        {Array.from({ length: opponentCardCount }).map((_, index) => (
          <motion.div
            key={`opponent-${index}`}
            initial="deck"
            animate={isDistributing ? "opponentHand" : undefined}
            variants={cardVariants}
            custom={index}
            style={{ position: 'absolute', transformOrigin: 'center' }}
          >
            <BattleCard
              isFlipped={true}
              isWinner={false}
              action="attack"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  );
} 