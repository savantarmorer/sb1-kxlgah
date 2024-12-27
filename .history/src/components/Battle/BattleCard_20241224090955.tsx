import React from 'react';
import { Box, Paper, Typography, useTheme, alpha } from '@mui/material';
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
    y: -5,
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

const getCardColor = (type: string, isWildcard: boolean = false) => {
  if (isWildcard) {
    return '#ffd700'; // Gold color for wildcards
  }
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

const getCardIcon = (type: string, isWildcard: boolean = false) => {
  if (isWildcard) {
    return '🃏'; // Joker card emoji for wildcards
  }
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

const getCardBackground = (type: string, theme: any, isWildcard: boolean = false) => {
  const color = getCardColor(type, isWildcard);
  if (isWildcard) {
    return `
      radial-gradient(circle at 50% 0%, ${alpha(color, 0.6)} 0%, transparent 75%),
      linear-gradient(135deg, ${alpha('#ffd700', 0.3)} 0%, ${alpha('#ff8c00', 0.2)} 50%, transparent 100%)
    `;
  }
  return `
    radial-gradient(circle at 50% 0%, ${alpha(color, 0.4)} 0%, transparent 75%),
    linear-gradient(135deg, ${alpha(color, 0.2)} 0%, ${alpha(color, 0.1)} 50%, transparent 100%)
  `;
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
            width: 160,
            height: 220,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: showBack
              ? `repeating-linear-gradient(
                  45deg,
                  ${theme.palette.grey[300]},
                  ${theme.palette.grey[300]} 10px,
                  ${theme.palette.grey[400]} 10px,
                  ${theme.palette.grey[400]} 20px
                )`
              : card
              ? getCardBackground(card.type, theme)
              : theme.palette.grey[300],
            border: `2px solid ${
              card ? getCardColor(card.type) : theme.palette.grey[400]
            }`,
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s',
            overflow: 'hidden'
          }}
        >
          {!showBack && card && (
            <>
              {/* Card Frame */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  border: '8px solid transparent',
                  borderImage: `linear-gradient(135deg, ${alpha(getCardColor(card.type), 0.6)}, transparent) 1`
                }}
              />

              {/* Card Header */}
              <Box
                sx={{
                  width: '100%',
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: `2px solid ${alpha(getCardColor(card.type, card.isWildcard), 0.3)}`
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    color: getCardColor(card.type, card.isWildcard),
                    textShadow: `0 0 5px ${alpha(getCardColor(card.type, card.isWildcard), 0.3)}`
                  }}
                >
                  {getCardIcon(card.type, card.isWildcard)}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    color: getCardColor(card.type, card.isWildcard)
                  }}
                >
                  {card.power}
                </Typography>
              </Box>

              {/* Card Name */}
              <Typography
                variant="subtitle1"
                sx={{
                  mt: 2,
                  px: 1,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: getCardColor(card.type, card.isWildcard),
                  textTransform: 'uppercase'
                }}
              >
                {card.isWildcard ? 'Wildcard' : card.type}
              </Typography>

              {/* Card Description */}
              <Box
                sx={{
                  flex: 1,
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: '0.75rem',
                    lineHeight: 1.2,
                    fontStyle: card.isWildcard ? 'italic' : 'normal'
                  }}
                >
                  {card.description}
                </Typography>
              </Box>

              {/* Card Footer */}
              <Box
                sx={{
                  width: '100%',
                  p: 1,
                  borderTop: `2px solid ${alpha(getCardColor(card.type, card.isWildcard), 0.3)}`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {card.isWildcard && (
                  <Box
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      bgcolor: alpha(getCardColor(card.type, true), 0.1),
                      border: `1px solid ${alpha(getCardColor(card.type, true), 0.3)}`
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: getCardColor(card.type, true),
                        fontWeight: 'bold'
                      }}
                    >
                      WILD
                    </Typography>
                  </Box>
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontStyle: 'italic'
                  }}
                >
                  {card.isUsed ? 'Used' : 'Ready'}
                </Typography>
              </Box>
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
                )`,
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: 8,
                  border: `2px solid ${theme.palette.grey[500]}`,
                  borderRadius: 1
                }
              }}
            />
          )}
        </Paper>
      </motion.div>
    </AnimatePresence>
  );
}; 