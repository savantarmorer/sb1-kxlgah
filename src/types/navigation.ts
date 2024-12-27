/**
 * Navigation view types for the application
 * Used by AppContent and Navigation components
 */
import { Home, Swords, Trophy, Package, Store, Settings, LucideIcon } from 'lucide-react';
import { ReactElement } from 'react';

export type View = 
  | '/' 
  | '/battle' 
  | '/shop' 
  | '/inventory' 
  | '/profile' 
  | '/settings'
  | '/tournament'
  | '/study'
  | '/achievements';

export interface NavigationItem {
  id: string;
  label: string;
  path: View;
  icon: LucideIcon;
}

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

export const navigation_items: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    icon: Home
  },
  {
    id: 'battle',
    label: 'Battle',
    path: '/battle',
    icon: Swords
  },
  {
    id: 'tournament',
    label: 'Tournament',
    path: '/tournament',
    icon: Trophy
  },
  {
    id: 'inventory',
    label: 'Inventory',
    path: '/inventory',
    icon: Package
  },
  {
    id: 'shop',
    label: 'Shop',
    path: '/shop',
    icon: Store
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: Settings
  }
];

