import React from 'react';
import { Box, Card, CardContent, Typography, Button, Chip, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme, alpha } from '@mui/material/styles';
import { Coins, Info } from 'lucide-react';
import type { Theme } from '@mui/material/styles';
import type { ShopItemResponse } from '../../types/shop';

interface ItemCardProps {
  item: ShopItemResponse;
  onPurchase: () => void;
  loading?: boolean;
}

const rarityColors = {
  common: 'neutral.400',
  uncommon: 'success.main',
  rare: 'info.main',
  epic: 'secondary.main',
  legendary: 'warning.main',
} as const;

export function ItemCard({ item, onPurchase, loading }: ItemCardProps) {
  const theme = useTheme<Theme>();

  const cardStyles = {
    position: 'relative',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: 'blur(8px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    transition: theme.transitions.create(['transform', 'box-shadow'], {
      duration: theme.transitions.duration.standard,
    }),
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[4],
    },
  };

  const iconStyles = {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    marginBottom: theme.spacing(2),
    boxShadow: theme.shadows[2],
  };

  const priceStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    color: theme.palette.text.primary,
    background: alpha(theme.palette.background.paper, 0.1),
    padding: theme.spacing(1, 2),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
  };

  if (!item.item) {
    return null;
  }

  const rarity = item.item.rarity?.toLowerCase() as keyof typeof rarityColors;
  const rarityColor = rarity && rarityColors[rarity] 
    ? rarityColors[rarity] 
    : rarityColors.common;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={cardStyles}>
        <CardContent>
          {/* Item Icon */}
          <Box sx={iconStyles}>
            {item.item.icon && (
              <img
                src={item.item.icon}
                alt={item.item.name}
                style={{ width: 40, height: 40 }}
              />
            )}
          </Box>

          {/* Item Name & Rarity */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {item.item.name}
            </Typography>
            {item.item.rarity && (
              <Chip
                label={item.item.rarity.toUpperCase()}
                size="small"
                sx={{
                  bgcolor: theme.palette[rarityColor.split('.')[0]][rarityColor.split('.')[1]],
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
            )}
          </Box>

          {/* Item Description */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              minHeight: 60,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.item.description}
          </Typography>

          {/* Effects Info */}
          {item.item.effects && (
            <Tooltip
              title={
                <Box>
                  {Object.entries(item.item.effects).map(([key, value]) => (
                    <Typography key={key} variant="body2">
                      {key}: {value}
                    </Typography>
                  ))}
                </Box>
              }
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2,
                  cursor: 'help',
                }}
              >
                <Info size={16} />
                <Typography variant="body2" color="text.secondary">
                  View Effects
                </Typography>
              </Box>
            </Tooltip>
          )}

          {/* Price & Purchase Button */}
          <Box
            sx={{
              mt: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={priceStyles}>
              <Coins size={16} />
              <Typography variant="subtitle1" fontWeight="bold">
                {item.price.toLocaleString()}
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={onPurchase}
              disabled={loading}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                },
              }}
            >
              {loading ? 'Purchasing...' : 'Purchase'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * ItemCard Component
 * 
 * Purpose:
 * - Reusable card component for displaying shop items
 * - Handles item display, pricing, and purchase actions
 * 
 * Props:
 * - item: GameItem object with item details
 * - price: Current price
 * - discountPrice: Optional discounted price
 * - discountEndsAt: Discount end date
 * - stock: Optional stock count
 * - isFeatured: Whether item is featured
 * - isLoading: Loading state
 * - onPurchase: Purchase handler
 * 
 * Features:
 * - Animations and transitions
 * - Price display with discounts
 * - Stock management
 * - Loading states
 * - Featured item indicator
 * 
 * Used By:
 * - ShopSystem component
 * 
 * Dependencies:
 * - Material-UI components
 * - Framer Motion
 * - Lucide icons
 */ 