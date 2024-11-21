/**
 * Navigation view types for the application
 * Used by AppContent and Navigation components
 */
export type View = 
  | 'home' 
  | 'battle'  // Battle view
  | 'leaderboard' 
  | 'quests' 
  | 'store' 
  | 'profile' 
  | 'inventory' 
  | 'admin';

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

