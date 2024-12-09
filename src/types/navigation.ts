/**
 * Navigation view types for the application
 * Used by AppContent and Navigation components
 */
export type View = 
  | '/' 
  | '/battle' 
  | '/shop' 
  | '/inventory' 
  | '/profile' 
  | '/settings';

/**
 * Dependencies:
 * - None (pure type definition)
 * 
 * Used by:
 * - AppContent.tsx
 * - Navigation.tsx
 * - NavigationProps interface
 * 
 * Features:
 * - Type-safe navigation
 * - Centralized view definition
 * - Easy to extend
 * 
 * Related Components:
 * - Navigation
 * - AppContent
 * - All view components
 */

export const navigation_items = [
  {
    id: 'home',
    label: 'Home',
    path: '/home',
    icon: 'home'
  },
  {
    id: 'battle',
    label: 'Battle',
    path: '/battle',
    icon: 'swords'
  },
  {
    id: 'tournament',
    label: 'Tournament',
    path: '/tournament',
    icon: 'trophy'
  },
  {
    id: 'inventory',
    label: 'Inventory',
    path: '/inventory',
    icon: 'backpack'
  },
  {
    id: 'shop',
    label: 'Shop',
    path: '/shop',
    icon: 'store'
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: 'settings'
  }
];

