import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { BattleCard } from './BattleCard';

interface CardDistributionProps {
  playerHand: any[];
  opponentHand: any[];
  onComplete: () => void;
}

export function CardDistribution({ playerHand, opponentHand, onComplete }: CardDistributionProps) {
  // Call onComplete after animation finishes
  useEffect(() => {
    const timer = setTimeout(() => {
      console.debug('[CardDistribution] Distribution animation complete, calling onComplete');
      onComplete();
    }, 1000); // 1 second for distribution animation

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <Box sx={{ 
      position: 'relative',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <AnimatePresence>
        {/* Player's cards */}
        <Box sx={{ 
          position: 'absolute',
          bottom: '10%',
          display: 'flex',
          gap: 2
        }}>
          {playerHand.map((card, index) => (
            <motion.div
              key={`player-card-${index}`}
              initial={{ y: -200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.2 }}
            >
              <BattleCard
                isFlipped={false}
                action={card.action}
                power={card.power}
                effect={card.effect}
              />
            </motion.div>
          ))}
        </Box>

        {/* Opponent's cards */}
        <Box sx={{ 
          position: 'absolute',
          top: '10%',
          display: 'flex',
          gap: 2
        }}>
          {opponentHand.map((_, index) => (
            <motion.div
              key={`opponent-card-${index}`}
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.2 }}
            >
              <BattleCard
                isFlipped={true}
                action="unknown"
                power={0}
              />
            </motion.div>
          ))}
        </Box>
      </AnimatePresence>
    </Box>
  );
} 