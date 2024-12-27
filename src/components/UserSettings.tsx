import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, Bell, Globe, Camera, User, Save } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { use_language } from '../contexts/LanguageContext';
import { useColorMode } from '../contexts/ColorModeContext';
import ThemeToggle from './ThemeToggle';
import { Modal } from './Modal';

interface UserSettingsProps {
  on_close: () => void;
}

interface UserProfile {
  name: string;
  title?: string;
  avatar: string;
}

export default function UserSettings({ on_close }: UserSettingsProps) {
  const { state, dispatch } = useGame();
  const { language, setLanguage } = use_language();

  if (!state.user) {
    return null;
  }

  const [formData, setFormData] = useState<UserProfile>({
    name: state.user?.name || '',
    title: state.user?.display_title || '',
    avatar: state.user?.avatar_url || '/avatars/default1.jpg'
  });

  const [settings, setSettings] = useState({
    sound: true,
    notifications: true
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!state.user?.id) {
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      dispatch({
        type: 'UPDATE_USER_PROFILE',
        payload: {
          name: formData.name,
          avatar_url: formData.avatar,
          display_title: formData.title
        }
      });
      on_close();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      is_open={true}
      on_close={on_close}
      title="Settings"
    >
      <div className="space-y-6">
        {/* Profile Section */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={formData.avatar}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
              <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors">
                <Camera size={16} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
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
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
        </div>

        {/* Settings Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Volume2 className="text-gray-600 dark:text-gray-400" />
              <span className="font-medium dark:text-white">Sound</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.sound}
                onChange={e => setSettings(prev => ({ ...prev, sound: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="text-gray-600 dark:text-gray-400" />
              <span className="font-medium dark:text-white">Notifications</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={e => setSettings(prev => ({ ...prev, notifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Globe className="text-gray-600 dark:text-gray-400" />
              <span className="font-medium dark:text-white">Language</span>
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
              <span className="font-medium dark:text-white">Theme</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={on_close}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
            disabled={isLoading}
          >
            <Save size={16} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}