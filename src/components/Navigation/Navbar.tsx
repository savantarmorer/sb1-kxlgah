import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Home, Book, Swords, User, Settings } from 'lucide-react';
import { useAchievements } from '../../hooks/useAchievements';

export function Navbar() {
  const { achievements } = useAchievements();
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <Link
              to="/"
              className="inline-flex items-center px-1 pt-1 text-gray-900 dark:text-white"
            >
              <Home size={20} className="mr-2" />
              Home
            </Link>

            <Link
              to="/battle"
              className="inline-flex items-center px-1 pt-1 text-gray-900 dark:text-white"
            >
              <Swords size={20} className="mr-2" />
              Battle
            </Link>

            <Link
              to="/study"
              className="inline-flex items-center px-1 pt-1 text-gray-900 dark:text-white"
            >
              <Book size={20} className="mr-2" />
              Study
            </Link>

            <Link
              to="/achievements"
              className="inline-flex items-center px-1 pt-1 text-gray-900 dark:text-white"
            >
              <Trophy size={20} className="mr-2 text-yellow-500" />
              Achievements
              {unlockedCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  {unlockedCount}
                </span>
              )}
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/profile"
              className="p-2 text-gray-900 dark:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <User size={20} />
            </Link>
            <Link
              to="/settings"
              className="p-2 text-gray-900 dark:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Settings size={20} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 