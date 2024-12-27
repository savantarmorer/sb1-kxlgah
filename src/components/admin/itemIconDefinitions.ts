import * as Icons from '@mui/icons-material';
import { SvgIconComponent } from '@mui/icons-material';

export const ITEM_ICONS = {
  weapons: [
    { name: 'Sword', icon: Icons.GavelOutlined },
    { name: 'Shield', icon: Icons.ShieldOutlined },
    { name: 'Bow', icon: Icons.GpsFixedOutlined },
    { name: 'Staff', icon: Icons.AutoFixHighOutlined },
    { name: 'Axe', icon: Icons.HandymanOutlined },
    { name: 'Dagger', icon: Icons.ContentCutOutlined },
  ],
  armor: [
    { name: 'Helmet', icon: Icons.Face3Outlined },
    { name: 'Chestplate', icon: Icons.SecurityOutlined },
    { name: 'Boots', icon: Icons.DirectionsRunOutlined },
    { name: 'Gloves', icon: Icons.PanToolOutlined },
    { name: 'Ring', icon: Icons.CircleOutlined },
    { name: 'Amulet', icon: Icons.DiamondOutlined },
  ],
  consumables: [
    { name: 'Potion', icon: Icons.LocalDrinkOutlined },
    { name: 'Scroll', icon: Icons.DescriptionOutlined },
    { name: 'Food', icon: Icons.RestaurantOutlined },
    { name: 'Book', icon: Icons.MenuBookOutlined },
    { name: 'Crystal', icon: Icons.DiamondOutlined },
    { name: 'Elixir', icon: Icons.ScienceOutlined },
  ],
  magic: [
    { name: 'Wand', icon: Icons.AutoFixHighOutlined },
    { name: 'Orb', icon: Icons.BlurOnOutlined },
    { name: 'Rune', icon: Icons.GradeOutlined },
    { name: 'Spell', icon: Icons.AutoAwesomeOutlined },
    { name: 'Enchant', icon: Icons.AutoFixNormalOutlined },
  ],
  tools: [
    { name: 'Pickaxe', icon: Icons.HandymanOutlined },
    { name: 'Fishing Rod', icon: Icons.PhishingOutlined },
    { name: 'Hammer', icon: Icons.GavelOutlined },
    { name: 'Compass', icon: Icons.ExploreOutlined },
  ],
  special: [
    { name: 'Key', icon: Icons.VpnKeyOutlined },
    { name: 'Chest', icon: Icons.Inventory2Outlined },
    { name: 'Map', icon: Icons.MapOutlined },
    { name: 'Crown', icon: Icons.WorkspacePremiumOutlined },
    { name: 'Trophy', icon: Icons.EmojiEventsOutlined },
    { name: 'Gift', icon: Icons.CardGiftcardOutlined },
  ],
  effects: [
    { name: 'XP Boost', icon: Icons.TrendingUpOutlined },
    { name: 'Coin Boost', icon: Icons.PaidOutlined },
    { name: 'Power Up', icon: Icons.BoltOutlined },
    { name: 'Time Boost', icon: Icons.TimerOutlined },
    { name: 'Shield', icon: Icons.ShieldOutlined },
    { name: 'Speed', icon: Icons.SpeedOutlined },
  ],
} as const;

export const iconPreviewEffects = {
  rare: {
    animation: 'pulse 2s infinite',
    filter: 'drop-shadow(0 0 2px #3f51b5)',
  },
  epic: {
    animation: 'rotate 3s linear infinite',
    filter: 'drop-shadow(0 0 3px #9c27b0)',
  },
  legendary: {
    animation: 'shine 2s infinite',
    filter: 'drop-shadow(0 0 4px #f57c00)',
  },
} as const;

export const iconAnimations = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes shine {
    0% { filter: brightness(1) drop-shadow(0 0 4px #f57c00); }
    50% { filter: brightness(1.3) drop-shadow(0 0 8px #f57c00); }
    100% { filter: brightness(1) drop-shadow(0 0 4px #f57c00); }
  }
`;

export interface IconData {
  name: string;
  icon: SvgIconComponent;
  color?: string;
} 