import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, Check, Image as ImageIcon } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';

const AVATAR_FRAMES = [
  { id: 'default', name: 'Default', borderColor: 'border-gray-200' },
  { id: 'gold', name: 'Gold', borderColor: 'border-yellow-400' },
  { id: 'diamond', name: 'Diamond', borderColor: 'border-blue-400' },
  { id: 'premium', name: 'Premium', borderColor: 'border-purple-400' }
];

export default function AvatarCustomizer() {
  const { state, dispatch } = useGame();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState(state.user?.avatar_frame || 'default');
  const [previewImage, setPreviewImage] = useState(state.user?.avatar || '/default-avatar.png');
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveChanges = async () => {
    setIsLoading(true);
    try {
      dispatch({
        type: 'UPDATE_USER_PROFILE',
        payload: {
          avatar: previewImage,
          avatarFrame: selectedFrame
        }
      });
      setIsEditing(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Avatar Customization</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <Camera size={18} />
            <span>Customize</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={previewImage}
                alt="Avatar preview"
                className={`w-32 h-32 rounded-full object-cover border-4 ${AVATAR_FRAMES.find(f => f.id === selectedFrame)?.borderColor}`}
              />
              <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors">
                <Camera size={20} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Avatar Frames</h4>
            <div className="grid grid-cols-2 gap-3">
              {AVATAR_FRAMES.map((frame) => (
                <button
                  key={frame.id}
                  onClick={() => setSelectedFrame(frame.id)}
                  className={`p-3 rounded-lg border ${
                    selectedFrame === frame.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  } flex items-center space-x-2`}
                >
                  <div className={`w-8 h-8 rounded-full ${frame.borderColor} border-2`} />
                  <span className="font-medium">{frame.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2"
              disabled={isLoading}
            >
              <X size={18} />
              <span>Cancel</span>
            </button>
            <button
              onClick={saveChanges}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
              disabled={isLoading}
            >
              <Check size={18} />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-4">
          <img
            src={state.user.avatar}
            alt={state.user.name}
            className={`w-24 h-24 rounded-full object-cover border-4 ${
              AVATAR_FRAMES.find(f => f.id === state.user.avatarFrame)?.borderColor || AVATAR_FRAMES[0].borderColor
            }`}
          />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">{state.user.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {AVATAR_FRAMES.find(f => f.id === state.user.avatarFrame)?.name || 'Default'} Frame
            </p>
          </div>
        </div>
      )}
    </div>
  );
}