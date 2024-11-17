import React, { useState } from 'react';
<<<<<<< HEAD
import { motion } from 'framer-motion';
import { X, Volume2, Bell, Globe, Camera, User, Save } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
=======
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, Bell, Globe, Camera, User } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useLanguage } from '../contexts/LanguageContext';
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
import ThemeToggle from './ThemeToggle';

interface UserSettingsProps {
  onClose: () => void;
}

export default function UserSettings({ onClose }: UserSettingsProps) {
  const { state, dispatch } = useGame();
  const { language, setLanguage, t } = useLanguage();
<<<<<<< HEAD
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    name: state.user.name,
    title: state.user.title || '',
    avatar: state.user.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
  });
  const [settings, setSettings] = useState({
    sound: true,
    notifications: true
  });
=======
  const [profileData, setProfileData] = useState({
    name: state.user.name,
    title: state.user.title || '',
    avatar: state.user.avatar
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewImage(base64String);
        setProfileData(prev => ({ ...prev, avatar: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_PROFILE',
<<<<<<< HEAD
      payload: formData
=======
      payload: {
        name: profileData.name,
        title: profileData.title,
        avatar: profileData.avatar
      }
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
      >
        <div className="flex justify-between items-center mb-6">
<<<<<<< HEAD
          <h2 className="text-2xl font-bold dark:text-white">Configurações</h2>
=======
          <h2 className="text-2xl font-bold dark:text-white">{t('common.settings')}</h2>
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} className="dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <img
<<<<<<< HEAD
                  src={formData.avatar}
=======
                  src={previewImage || profileData.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
                <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors">
                  <Camera size={16} className="text-white" />
                  <input
                    type="file"
                    accept="image/*"
<<<<<<< HEAD
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({
                            ...prev,
                            avatar: reader.result as string
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
=======
                    onChange={handleImageChange}
                    className="hidden"
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
<<<<<<< HEAD
                Nome
=======
                {t('profile.nickname')}
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
              </label>
              <div className="relative">
                <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
<<<<<<< HEAD
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
=======
                  value={profileData.name}
                  onChange={e => setProfileData(prev => ({ ...prev, name: e.target.value }))}
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
                  className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
<<<<<<< HEAD
                Título
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
=======
                {t('profile.title')}
              </label>
              <input
                type="text"
                value={profileData.title}
                onChange={e => setProfileData(prev => ({ ...prev, title: e.target.value }))}
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Volume2 className="text-gray-600 dark:text-gray-400" />
<<<<<<< HEAD
                <span className="font-medium dark:text-white">Som</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.sound}
                  onChange={e => setSettings(prev => ({ ...prev, sound: e.target.checked }))}
                  className="sr-only peer"
                />
=======
                <span className="font-medium dark:text-white">{t('settings.sound')}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="text-gray-600 dark:text-gray-400" />
<<<<<<< HEAD
                <span className="font-medium dark:text-white">Notificações</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={e => setSettings(prev => ({ ...prev, notifications: e.target.checked }))}
                  className="sr-only peer"
                />
=======
                <span className="font-medium dark:text-white">{t('settings.notifications')}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Globe className="text-gray-600 dark:text-gray-400" />
<<<<<<< HEAD
                <span className="font-medium dark:text-white">Idioma</span>
=======
                <span className="font-medium dark:text-white">{t('settings.language')}</span>
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'pt' | 'en')}
                className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="pt">Português</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
<<<<<<< HEAD
                <span className="font-medium dark:text-white">Tema</span>
=======
                <span className="font-medium dark:text-white">{t('settings.theme')}</span>
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
<<<<<<< HEAD
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Save size={16} />
            <span>Salvar</span>
=======
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {t('common.save')}
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}