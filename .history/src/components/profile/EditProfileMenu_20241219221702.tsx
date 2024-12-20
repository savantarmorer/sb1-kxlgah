import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, X } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { AvatarSelector } from '../AvatarSelector';
import { supabase } from '../../lib/supabase.ts';
import { useNotification } from '../../contexts/NotificationContext';

interface EditProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileMenu({ isOpen, onClose }: EditProfileMenuProps) {
  const { state, dispatch } = useGame();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);

  // Early return if no user or modal is closed
  if (!isOpen || !state.user) return null;

  const handleAvatarSelect = async (avatarId: number) => {
    if (!state.user?.id) {
      showError('User not found');
      return;
    }

    try {
      setLoading(true);
      
      // First get the avatar URL
      const { data: avatar, error: avatarError } = await supabase
        .from('avatars')
        .select('url')
        .eq('id', avatarId)
        .single();

      if (avatarError) throw avatarError;

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          avatar_id: avatarId,
          avatar_url: avatar.url,
          updated_at: new Date().toISOString()
        })
        .eq('id', state.user.id);

      if (profileError) throw profileError;

      // Update user_progress table
      const { error: progressError } = await supabase
        .from('user_progress')
        .update({
          avatar_id: avatarId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', state.user.id);

      if (progressError) throw progressError;

      // Update local state
      dispatch({
        type: 'UPDATE_USER_PROFILE',
        payload: { 
          avatar: String(avatarId),
          avatar_url: avatar.url
        }
      });

      showSuccess('Avatar updated successfully');
      onClose(); // Close modal after successful update
    } catch (error) {
      console.error('Error updating avatar:', error);
      showError('Failed to update avatar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full mx-auto overflow-hidden border border-gray-200 dark:border-gray-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-10">
          {/* Current Avatar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-8"
          >
            <motion.div 
              className="relative group"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <motion.div
                className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-200"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              <img
                src={state.user.avatar_url || '/avatars/default1.jpg'}
                alt={state.user.name || 'User'}
                className="relative w-28 h-28 rounded-full object-cover ring-4 ring-white dark:ring-gray-800"
              />
              <motion.div 
                className="absolute -bottom-2 -right-2 bg-indigo-500 rounded-full p-2 shadow-lg border-2 border-white dark:border-gray-800"
                whileHover={{ scale: 1.1, rotate: 15 }}
              >
                <Camera className="w-5 h-5 text-white" />
              </motion.div>
            </motion.div>
            <div>
              <motion.h3 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
              >
                {state.user.name || 'User'}
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm text-gray-500 dark:text-gray-400 mt-2"
              >
                Choose your avatar from the options below
              </motion.p>
            </div>
          </motion.div>

          {/* Avatar Selector */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border-t border-gray-200 dark:border-gray-700 pt-8"
          >
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Camera className="w-4 h-4 text-indigo-500" />
              Available Avatars
            </h4>
            <AvatarSelector onSelect={handleAvatarSelect} />
          </motion.div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
} 