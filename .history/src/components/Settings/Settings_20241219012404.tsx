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
    <PageContainer className="bg-gradient-to-b from-app-gradient-dark-start to-app-gradient-dark-end min-h-screen">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="p-3 rounded-full bg-app-primary/20 backdrop-blur-sm">
            <SettingsIcon className="w-8 h-8 text-app-primary-light" />
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-app-gradient-primary-start via-app-gradient-secondary-start to-app-gradient-secondary-end bg-clip-text text-transparent">
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
            className="bg-app-card/50 backdrop-blur-lg rounded-2xl p-6 border border-app-primary/20 shadow-glow-primary shadow-app-primary/10 hover:shadow-app-primary/20 transition-all duration-300"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 rounded-lg bg-app-primary/20">
                {mode === 'dark' ? (
                  <Moon className="w-6 h-6 text-app-primary-light" />
                ) : (
                  <Sun className="w-6 h-6 text-app-primary-light" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-app-text-primary">Theme</h3>
            </div>
            <select 
              value={mode}
              onChange={(e) => setMode(e.target.value as 'light' | 'dark' | 'system')}
              className="w-full px-4 py-3 rounded-xl bg-app-background-light/50 border border-app-primary/30 text-app-text-primary focus:ring-2 focus:ring-app-primary focus:border-transparent outline-none transition-all"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </motion.div>

          {/* Sound Section */}
          <motion.div 
            variants={itemVariants}
            className="bg-app-card/50 backdrop-blur-lg rounded-2xl p-6 border border-app-secondary/20 shadow-glow-secondary shadow-app-secondary/10 hover:shadow-app-secondary/20 transition-all duration-300"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 rounded-lg bg-app-secondary/20">
                <Volume2 className="w-6 h-6 text-app-secondary-light" />
              </div>
              <h3 className="text-xl font-semibold text-app-text-primary">Sound</h3>
            </div>
            <div className="flex items-center gap-6">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMute}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  isMuted 
                    ? 'bg-app-background-light/50 text-app-text-muted border border-app-border-dark/30'
                    : 'bg-app-secondary/20 text-app-secondary-light border border-app-secondary/30'
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
                  className="w-full accent-app-secondary bg-app-background-light/50 h-2 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </motion.div>

          {/* Language Section */}
          <motion.div 
            variants={itemVariants}
            className="bg-app-card/50 backdrop-blur-lg rounded-2xl p-6 border border-app-gradient-secondary-end/20 shadow-glow-secondary shadow-app-gradient-secondary-end/10 hover:shadow-app-gradient-secondary-end/20 transition-all duration-300"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 rounded-lg bg-app-gradient-secondary-end/20">
                <Languages className="w-6 h-6 text-app-gradient-secondary-end" />
              </div>
              <h3 className="text-xl font-semibold text-app-text-primary">Language</h3>
            </div>
            <select 
              value={language}
              onChange={handleLanguageChange}
              className="w-full px-4 py-3 rounded-xl bg-app-background-light/50 border border-app-gradient-secondary-end/30 text-app-text-primary focus:ring-2 focus:ring-app-gradient-secondary-end focus:border-transparent outline-none transition-all"
            >
              <option value="en">English</option>
              <option value="pt">Português</option>
              <option value="es">Español</option>
            </select>
          </motion.div>

          {/* Profile Section */}
          <motion.div 
            variants={itemVariants}
            className="bg-app-card/50 backdrop-blur-lg rounded-2xl p-6 border border-brand-teal-500/20 shadow-glow-primary shadow-brand-teal-500/10 hover:shadow-brand-teal-500/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-brand-teal-500/20">
                  <User className="w-6 h-6 text-brand-teal-400" />
                </div>
                <h3 className="text-xl font-semibold text-app-text-primary">Profile</h3>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditProfileOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-brand-teal-500 to-brand-teal-400 text-app-text-primary rounded-xl font-medium shadow-glow-primary shadow-brand-teal-500/20 hover:shadow-brand-teal-500/40 transition-all duration-300 flex items-center gap-2"
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