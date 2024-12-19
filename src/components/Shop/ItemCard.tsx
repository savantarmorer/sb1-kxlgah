import React from 'react';
import { Box, Card, CardContent, Typography, Button, Chip, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { Coins, Info } from 'lucide-react';
import type { AppTheme } from '../../theme/types/theme.d';
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
  default: 'neutral.400'
} as const;

export function ItemCard({ item, onPurchase, loading }: ItemCardProps) {
  const theme = useTheme<AppTheme>();

  const rarity = item?.rarity || 'common';
  const rarityColor = rarityColors[rarity as keyof typeof rarityColors] || rarityColors.default;

  const cardStyles = {
    position: 'relative',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    ...theme.styles.effects.glassmorphismLight,
    border: theme.styles.border.light,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadow.glow(theme.colors.brand.primary[500]),
    },
  };

  const iconStyles = {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: theme.gradients.brand.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    marginBottom: 2,
    boxShadow: theme.shadow.md,
  };

  const priceStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    color: theme.colors.neutral.white,
    background: theme.gradients.dark.subtle,
    padding: theme.spacing(1, 2),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadow.sm,
  };

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
            {item?.icon && (
              <img
                src={item.icon}
                alt={item.name || 'Item'}
                style={{ width: 40, height: 40 }}
              />
            )}
          </Box>

          {/* Item Name & Rarity */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {item?.name || 'Unknown Item'}
            </Typography>
            <Chip
              label={(rarity || 'common').toUpperCase()}
              size="small"
              sx={{
                bgcolor: rarityColor,
                color: 'white',
                fontWeight: 'bold',
              }}
            />
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
            {item?.description || 'No description available'}
          </Typography>

          {/* Effects Info */}
          {item.effects && (
            <Tooltip
              title={
                <Box>
                  {Object.entries(item.effects).map(([key, value]) => (
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
                background: theme.gradients.brand.primary,
                color: theme.colors.neutral.white,
                '&:hover': {
                  background: theme.gradients.brand.primaryDark,
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