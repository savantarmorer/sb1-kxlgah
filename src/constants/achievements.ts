import { Trophy, Star, Shield, Target, Swords, Book, Crown } from 'lucide-react';

export const ACHIEVEMENT_CATEGORIES = [
  { id: 'battle', label: 'Battle', icon: Swords, color: 'text-red-500' },
  { id: 'progress', label: 'Progress', icon: Target, color: 'text-blue-500' },
  { id: 'collection', label: 'Collection', icon: Star, color: 'text-yellow-500' },
  { id: 'mastery', label: 'Mastery', icon: Crown, color: 'text-purple-500' }
]; 