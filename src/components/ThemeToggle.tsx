import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useColorMode } from '../contexts/ColorModeContext';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { mode, setMode } = useColorMode();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      aria-label="Toggle theme"
    >
      {mode === 'dark' ? (
        <Sun size={20} className="text-yellow-500" />
      ) : (
        <Moon size={20} className="text-indigo-500" />
      )}
    </motion.button>
  );
}