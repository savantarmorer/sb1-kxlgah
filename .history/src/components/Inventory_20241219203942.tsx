import React from 'react';
import { useInventory } from '../hooks/useInventory';
import { useGame } from '../contexts/GameContext';
import { GameItem, ItemType, ItemRarity, ItemEffect, InventoryItem } from '../types/items';
import { Box, Grid, Typography, Button, Card, CardContent, CardActions, Chip, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { AppTheme } from '../theme/theme';
import { Package } from 'lucide-react';

interface ThemeProps {
  theme: AppTheme;
  rarity: ItemRarity;
}

interface RarityConfig {
  common: string;
  uncommon: string;
  rare: string;
  epic: string;
  legendary: string;
}

const getRarityColor = (theme: AppTheme, rarity: ItemRarity): string => {
  const colors: RarityConfig = {
    common: theme.palette.grey[300],
    uncommon: theme.palette.success.light,
    rare: theme.palette.info.light,
    epic: theme.palette.warning.light,
    legendary: theme.palette.error.light
  };
  return colors[rarity];
};

const RarityChip = styled(Chip)<{ rarity: ItemRarity }>(({ theme, rarity }: ThemeProps) => ({
  backgroundColor: getRarityColor(theme, rarity),
  color: theme.palette.getContrastText(getRarityColor(theme, rarity))
}));

const ItemCard = styled(Card)<{ rarity: ItemRarity }>(({ theme, rarity }: ThemeProps) => ({
  border: `2px solid ${getRarityColor(theme, rarity)}`,
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)'
  }
}));

interface ItemCardProps {
  item: InventoryItem;
  quantity: number;
  isEquipped: boolean;
  onUse: (item: InventoryItem) => void;
  onEquip: (item: InventoryItem) => void;
  onUnequip: (item: InventoryItem) => void;
}

const InventoryItemCard: React.FC<ItemCardProps> = ({
  item,
  quantity,
  isEquipped,
  onUse,
  onEquip,
  onUnequip
}) => {
  return (
    <ItemCard rarity={item.rarity}>
      <CardContent>
        <Typography variant="h6" component="div">
          {item.name}
        </Typography>
        <Box display="flex" gap={1} mb={1}>
          <RarityChip label={item.rarity} size="small" rarity={item.rarity} />
          <Chip label={item.type} size="small" />
          {isEquipped && <Chip label="Equipped" color="primary" size="small" />}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {item.description}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Quantity: {quantity}
        </Typography>
      </CardContent>
      <CardActions>
        {item.type === ItemType.CONSUMABLE && (
          <Button size="small" onClick={() => onUse(item)}>
            Use
          </Button>
        )}
        {(item.type === ItemType.EQUIPMENT || item.type === ItemType.COSMETIC) && (
          isEquipped ? (
            <Button size="small" onClick={() => onUnequip(item)}>
              Unequip
            </Button>
          ) : (
            <Button size="small" onClick={() => onEquip(item)}>
              Equip
            </Button>
          )
        )}
      </CardActions>
    </ItemCard>
  );
};

interface InventoryProps {
  className?: string;
}

export const Inventory: React.FC<InventoryProps> = ({ className }) => {
  const { state } = useGame();
  const {
    inventory,
    activeEffects,
    useItem,
    equipItem,
    unequipItem
  } = useInventory();

  if (state.syncing) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3} className={className}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Inventory
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your items, equipment, and consumables
        </Typography>
      </Box>
      
      {activeEffects.length > 0 && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Active Effects
          </Typography>
          <Box display="flex" gap={1}>
            {activeEffects.map((effect: ItemEffect, index: number) => (
              <Chip
                key={index}
                label={`${effect.type}: ${effect.value}x`}
                color="primary"
              />
            ))}
          </Box>
        </Box>
      )}

      {inventory.length > 0 ? (
        <Grid container spacing={2}>
          {inventory.map((inventoryItem: InventoryItem) => (
            <Grid item xs={12} sm={6} md={4} key={inventoryItem.id}>
              <InventoryItemCard
                item={inventoryItem}
                quantity={inventoryItem.quantity}
                isEquipped={inventoryItem.equipped}
                onUse={useItem}
                onEquip={equipItem}
                onUnequip={unequipItem}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          py={8}
          sx={{ 
            backgroundColor: 'background.paper',
            borderRadius: 1,
            border: 1,
            borderColor: 'divider'
          }}
        >
          <Package size={48} className="text-gray-400 mb-4" />
          <Typography variant="h6" gutterBottom>
            Your inventory is empty
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" maxWidth="sm">
            Visit the store to purchase items or complete quests to earn rewards.
          </Typography>
        </Box>
      )}
    </Box>
  );
};
