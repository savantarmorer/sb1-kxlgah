import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { CardEntity } from '../types';
import { motion } from 'framer-motion';

interface CardRendererProps {
  entity: CardEntity;
  onSelect?: (entity: CardEntity) => void;
}

export const CardRenderer: React.FC<CardRendererProps> = ({ entity, onSelect }) => {
  const theme = useTheme();
  const { card, isFlipped, isSelected } = entity;

  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={{
        scale: isSelected ? 1.1 : 1,
        rotateY: isFlipped ? 180 : 0
      }}
      transition={{ duration: 0.3 }}
      onClick={() => onSelect?.(entity)}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <Box
        sx={{
          width: 120,
          height: 160,
          borderRadius: 2,
          bgcolor: isFlipped ? theme.palette.primary.dark : theme.palette.primary.main,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onSelect ? 'pointer' : 'default',
          p: 1,
          boxShadow: isSelected ? 4 : 1,
          border: isSelected ? `2px solid ${theme.palette.secondary.main}` : 'none',
          backfaceVisibility: 'hidden',
          '&:hover': onSelect ? {
            transform: 'translateY(-5px)',
            transition: 'transform 0.2s'
          } : {}
        }}
      >
        {!isFlipped ? (
          <>
            <Typography variant="h6" sx={{ mb: 1 }}>{card.name}</Typography>
            <Typography>Força: {card.forca}</Typography>
            <Typography>Poder: {card.poder}</Typography>
          </>
        ) : (
          <Typography variant="h6" color="white">?</Typography>
        )}
      </Box>
    </motion.div>
  );
}; 