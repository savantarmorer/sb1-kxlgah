import React, { useState } from 'react';
import { useColorMode } from '../../contexts/ColorModeContext';
import { useSound } from '../../hooks/useSound';
import { use_language } from '../../contexts/LanguageContext';
import { EditProfileMenu } from '../profile/EditProfileMenu';
import { User, Moon, Sun, Volume2, Languages, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageContainer } from '../Layout/PageContainer';
import type { Languages as LanguageType } from '../../i18n/translations';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

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
    <PageContainer className="bg-gradient-to-b from-navy-900 to-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="p-3 rounded-full bg-indigo-600/20 backdrop-blur-sm">
            <SettingsIcon className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Settings
          </h2>
        </motion.div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6"
        >
          {/* Theme Section */}
          <motion.div 
            variants={itemVariants}
            className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-indigo-500/20 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all duration-300"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                {mode === 'dark' ? (
                  <Moon className="w-6 h-6 text-indigo-400" />
                ) : (
                  <Sun className="w-6 h-6 text-indigo-400" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-white">Theme</h3>
            </div>
            <select 
              value={mode}
              onChange={(e) => setMode(e.target.value as 'light' | 'dark' | 'system')}
              className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-indigo-500/30 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </motion.div>

          {/* Sound Section */}
          <motion.div 
            variants={itemVariants}
            className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Volume2 className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Sound</h3>
            </div>
            <div className="flex items-center gap-6">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMute}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  isMuted 
                    ? 'bg-gray-700/50 text-gray-300 border border-gray-600/30'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </motion.button>
              <div className="flex-1 px-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-purple-500 bg-gray-700/50 h-2 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </motion.div>

          {/* Language Section */}
          <motion.div 
            variants={itemVariants}
            className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-pink-500/20 shadow-lg shadow-pink-500/10 hover:shadow-pink-500/20 transition-all duration-300"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 rounded-lg bg-pink-500/20">
                <Languages className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Language</h3>
            </div>
            <select 
              value={language}
              onChange={handleLanguageChange}
              className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-pink-500/30 text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
            >
              <option value="en">English</option>
              <option value="pt">Português</option>
              <option value="es">Español</option>
            </select>
          </motion.div>

          {/* Profile Section */}
          <motion.div 
            variants={itemVariants}
            className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-teal-500/20 shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-teal-500/20">
                  <User className="w-6 h-6 text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Profile</h3>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditProfileOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-medium shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition-all duration-300 flex items-center gap-2"
              >
                <User className="w-5 h-5" />
                Edit Profile
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {isEditProfileOpen && (
            <EditProfileMenu 
              isOpen={isEditProfileOpen}
              onClose={() => setIsEditProfileOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </PageContainer>
  );
} 