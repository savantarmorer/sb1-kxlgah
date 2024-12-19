import React, { useState } from 'react';
import { useColorMode } from '../../contexts/ColorModeContext';
import { useSound } from '../../hooks/useSound';
import { use_language } from '../../contexts/LanguageContext';
import { EditProfileMenu } from '../profile/EditProfileMenu';
import { User, Moon, Sun, Volume2, Languages } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageContainer } from '../Layout/PageContainer';
import type { Languages as LanguageType } from '../../i18n/translations';

export default function Settings() {
  const { mode, setMode } = useColorMode();
  const sound = useSound('ui');
  const { language, setLanguage } = use_language();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      sound.stop();
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as LanguageType);
  };

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
        >
          Settings
        </motion.h2>
        
        <div className="grid gap-8">
          {/* Theme Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-4">
              {mode === 'dark' ? (
                <Moon className="w-5 h-5 text-indigo-500" />
              ) : (
                <Sun className="w-5 h-5 text-indigo-500" />
              )}
              <h3 className="text-lg font-semibold">Theme</h3>
            </div>
            <select 
              value={mode}
              onChange={(e) => setMode(e.target.value as 'light' | 'dark' | 'system')}
              className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </motion.div>

          {/* Sound Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <Volume2 className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-semibold">Sound</h3>
            </div>
            <div className="flex items-center gap-6">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMute}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isMuted 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                }`}
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </motion.button>
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </motion.div>

          {/* Language Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Languages className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-semibold">Language</h3>
            </div>
            <select 
              value={language}
              onChange={handleLanguageChange}
              className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="en">English</option>
              <option value="pt">Português</option>
              <option value="es">Español</option>
            </select>
          </div>

          {/* Profile Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-semibold">Profile</h3>
              </div>
              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        <EditProfileMenu 
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
        />
      </div>
    </PageContainer>
  );
} 