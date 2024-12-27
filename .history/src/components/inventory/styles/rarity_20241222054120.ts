import { ItemRarity } from '../../../types/items';

export const RARITY_STYLES = {
  [ItemRarity.COMMON]: {
    gradient: ['#9CA3AF', '#6B7280', '#4B5563'],
    glow: 'rgba(156, 163, 175, 0.5)',
    border: 'rgba(156, 163, 175, 0.3)',
    animation: 'pulse',
  },
  [ItemRarity.UNCOMMON]: {
    gradient: ['#34D399', '#10B981', '#059669'],
    glow: 'rgba(52, 211, 153, 0.5)',
    border: 'rgba(52, 211, 153, 0.3)',
    animation: 'pulse-green',
  },
  [ItemRarity.RARE]: {
    gradient: ['#60A5FA', '#3B82F6', '#2563EB'],
    glow: 'rgba(59, 130, 246, 0.5)',
    border: 'rgba(59, 130, 246, 0.3)',
    animation: 'pulse-blue',
  },
  [ItemRarity.EPIC]: {
    gradient: ['#A855F7', '#9333EA', '#7E22CE'],
    glow: 'rgba(147, 51, 234, 0.5)',
    border: 'rgba(147, 51, 234, 0.3)',
    animation: 'pulse-purple',
  },
  [ItemRarity.LEGENDARY]: {
    gradient: ['#F59E0B', '#D97706', '#B45309'],
    glow: 'rgba(245, 158, 11, 0.5)',
    border: 'rgba(245, 158, 11, 0.3)',
    animation: 'pulse-legendary',
  },
} as const;

export const cardStyles = {
  container: `
    perspective-1000 
    transform-style-preserve-3d 
    hover:scale-105 
    transition-transform
    duration-300
  `,
  glassPanel: `
    backdrop-blur-md
    bg-white/10
    border border-white/20
    rounded-xl
    shadow-xl
  `,
  content: `
    grid grid-cols-1 
    md:grid-cols-2 
    gap-4 p-4
  `,
  header: `
    text-center 
    mb-4 
    space-y-2
  `,
  description: `
    text-sm 
    text-white/90 
    line-clamp-3
  `,
  effects: `
    flex items-center 
    gap-2 
    text-sm
  `,
  stats: `
    grid 
    grid-cols-2 
    gap-2
  `,
} as const; 