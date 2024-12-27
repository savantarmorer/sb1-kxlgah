import React from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { BattleCard as BattleCardType } from '../../types/battle';
import { BATTLE_CONFIG } from '../../config/battleConfig';

interface BattleCardProps {
  card?: BattleCardType;
  isFlipped?: boolean;
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  showBack?: boolean;
}

const cardVariants = {
  initial: {
    rotateY: 0,
    scale: 1
  },
  flip: {
    rotateY: 180,
    transition: {
      duration: BATTLE_CONFIG.cards.flip_animation_duration / 1000
    }
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2
    }
  },
  selected: {
    scale: 1.1,
    y: -10,
    transition: {
      duration: 0.2
    }
  },
  disabled: {
    opacity: 0.5,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};

const getCardColor = (type: string) => {
  switch (type) {
    case 'ataque':
      return '#ff4444';
    case 'defesa':
      return '#44ff44';
    case 'contra_ataque':
      return '#4444ff';
    default:
      return '#888888';
  }
};

const getCardIcon = (type: string) => {
  switch (type) {
    case 'ataque':
      return '⚔️';
    case 'defesa':
      return '🛡️';
    case 'contra_ataque':
      return '↩️';
    default:
      return '❓';
  }
};

export const BattleCard: React.FC<BattleCardProps> = ({
  card,
  isFlipped = false,
  isSelected = false,
  isPlayable = true,
  onClick,
  showBack = false
}) => {
  const theme = useTheme();

  const getCardVariant = () => {
    if (!isPlayable) return 'disabled';
    if (isSelected) return 'selected';
    if (isFlipped) return 'flip';
    return 'initial';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial="initial"
        animate={getCardVariant()}
        whileHover={isPlayable && !isSelected ? 'hover' : undefined}
        variants={cardVariants}
        onClick={isPlayable ? onClick : undefined}
        style={{
          cursor: isPlayable ? 'pointer' : 'default',
          perspective: 1000
        }}
      >
        <Paper
          elevation={isSelected ? 8 : 3}
          sx={{
            width: 120,
            height: 160,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: showBack
              ? theme.palette.grey[300]
              : card
              ? `linear-gradient(135deg, ${getCardColor(card.type)}22, ${getCardColor(
                  card.type
                )}44)`
              : theme.palette.grey[300],
            border: `2px solid ${
              card ? getCardColor(card.type) : theme.palette.grey[400]
            }`,
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s'
          }}
        >
          {!showBack && card && (
            <>
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  fontSize: '1.5rem'
                }}
              >
                {getCardIcon(card.type)}
              </Box>

              <Typography
                variant="h6"
                sx={{
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: getCardColor(card.type)
                }}
              >
                {card.type}
              </Typography>

              {card.isWildcard && (
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: theme.palette.text.secondary
                  }}
                >
                  Wildcard
                </Typography>
              )}
            </>
          )}

          {showBack && (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `repeating-linear-gradient(
                  45deg,
                  ${theme.palette.grey[300]},
                  ${theme.palette.grey[300]} 10px,
                  ${theme.palette.grey[400]} 10px,
                  ${theme.palette.grey[400]} 20px
                )`
              }}
            />
          )}
        </Paper>
      </motion.div>
    </AnimatePresence>
  );
}; 