<<<<<<< HEAD
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCircle2 as User2Icon,
  ShieldCheck as ShieldIcon,
  Star as StarIcon,
  Camera, 
  Edit2, 
  Save, 
  X as CloseIcon
} from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { useAdminActions } from '../../hooks/useAdminActions';
import Button from '../Button';
import type { User } from '../../types';

/**
 * Interface for user profile updates
 * Extends User type to ensure ID is always present
 */
interface UserUpdateData extends Partial<User> {
  id: string;
}

/**
 * Interface for user profile form data
 */
interface UserProfileForm {
  name: string;
  title: string;
  avatar: string;
  roles: string[];
}

/**
 * Interface for component state
 */
interface UserManagerState {
  selectedUser: Partial<User> | null;
  isLoading: boolean;
  isEditing: boolean;
  formData: UserProfileForm;
}

/**
 * UserManager Component
 * Handles user management in the admin dashboard
 */
export default function UserManager(): JSX.Element {
  const { state } = useGame();
  const { updateUserProfile } = useAdminActions();
  
  // Initialize component state
  const [localState, setLocalState] = useState<UserManagerState>({
    selectedUser: null,
    isLoading: false,
    isEditing: false,
    formData: {
      name: '',
      title: '',
      avatar: '',
      roles: []
    }
  });

  /**
   * Handles user profile updates
   * @param updates - User data to update
   */
  const handleUpdateUser = async (updates: UserUpdateData) => {
    if (!updates.id) {
      console.error('User ID is required for updates');
      return;
    }

    try {
      setLocalState(prev => ({ ...prev, isLoading: true }));
      await updateUserProfile(updates.id, updates);
      setLocalState(prev => ({ ...prev, isEditing: false }));
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setLocalState(prev => ({ ...prev, isLoading: false }));
    }
  };

  /**
   * Handles role toggle for users
   * @param userId - ID of the user
   * @param role - Role to toggle
   */
  const handleToggleRole = (userId: string, role: string) => {
    const currentRoles = localState.formData.roles;
=======
import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { User2, Shield, Star, Award, Camera, Edit2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditProfileProps {
  onClose: () => void;
  onSave: (data: { name: string; title: string; avatar: string }) => void;
  initialData: {
    name: string;
    title: string;
    avatar: string;
  };
}

function EditProfileModal({ onClose, onSave, initialData }: EditProfileProps) {
  const [formData, setFormData] = useState(initialData);
  const [imagePreview, setImagePreview] = useState(initialData.avatar);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64String = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        setImagePreview(base64String);
        setFormData(prev => ({ ...prev, avatar: base64String }));
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
        <h3 className="text-xl font-bold mb-4 dark:text-white">Editar Perfil</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
              <label className="absolute bottom-0 right-0 p-1 bg-indigo-600 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors">
                <Camera size={16} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="input w-full"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center space-x-2"
            >
              <Save size={16} />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function UserManager() {
  const { state, dispatch } = useGame();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const handleUpdateProfile = (data: { name: string; title: string; avatar: string }) => {
    dispatch({
      type: 'UPDATE_USER_PROFILE',
      payload: data
    });
  };

  const handleToggleRole = (userId: string, role: string) => {
    const user = state.user;
    const currentRoles = user.roles || [];
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];

<<<<<<< HEAD
    setLocalState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        roles: newRoles
      }
    }));

    handleUpdateUser({
      id: userId,
      roles: newRoles
    });
  };

  /**
   * Handles edit mode toggle
   * @param user - User to edit
   */
  const handleEditClick = (user: User) => {
    setLocalState(prev => ({
      ...prev,
      selectedUser: user,
      isEditing: true,
      formData: {
        name: user.name,
        title: user.title || '',
        avatar: user.avatar || '',
        roles: user.roles || []
      }
    }));
  };

  /**
   * Handles form data updates
   * @param updates - Partial form data updates
   */
  const handleFormChange = (updates: Partial<UserProfileForm>) => {
    setLocalState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        ...updates
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* User Profile Section */}
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <User2Icon className="text-gray-400" size={24} />
            <h3 className="text-lg font-semibold dark:text-white">User Profile</h3>
          </div>
          <Button
            variant="primary"
            onClick={() => handleEditClick(state.user)}
            icon={<Edit2 size={16} />}
            disabled={localState.isLoading}
          >
            Edit Profile
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {localState.isEditing ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Edit Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={localState.formData.name}
                    onChange={e => handleFormChange({ name: e.target.value })}
                    className="input w-full"
                    disabled={localState.isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={localState.formData.title}
                    onChange={e => handleFormChange({ title: e.target.value })}
                    className="input w-full"
                    disabled={localState.isLoading}
                  />
                </div>
              </div>

              {/* Role Management */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <ShieldIcon className="text-gray-400" size={16} />
                  <label className="block text-sm font-medium mb-1">Roles</label>
                </div>
                <div className="flex space-x-2">
                  {['admin', 'moderator', 'premium'].map(role => (
                    <Button
                      key={role}
                      variant={localState.formData.roles.includes(role) ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleRole(state.user.id, role)}
                      disabled={localState.isLoading}
                      icon={role === 'premium' ? <StarIcon size={14} /> : <ShieldIcon size={14} />}
                    >
                      {role}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setLocalState(prev => ({ ...prev, isEditing: false }))}
                  disabled={localState.isLoading}
                  icon={<CloseIcon size={16} />}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleUpdateUser({
                    id: state.user.id,
                    ...localState.formData
                  })}
                  icon={<Save size={16} />}
                  disabled={localState.isLoading}
                >
                  Save Changes
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* User Info Display */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src={state.user.avatar || '/default-avatar.png'}
                    alt={state.user.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  {localState.isEditing && (
                    <button className="absolute bottom-0 right-0 p-1 bg-indigo-600 rounded-full">
                      <Camera size={16} className="text-white" />
                    </button>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold dark:text-white">{state.user.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{state.user.title}</p>
                </div>
              </div>

              {/* Role Badges */}
              <div className="flex flex-wrap gap-2">
                {state.user.roles?.map(role => (
                  <span
                    key={role}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                      role === 'admin'
                        ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                    }`}
                  >
                    {role === 'admin' ? (
                      <ShieldIcon size={12} className="mr-1" />
                    ) : role === 'premium' ? (
                      <StarIcon size={12} className="mr-1" />
                    ) : null}
                    {role}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Component Dependencies:
 * - Lucide icons for UI elements
 * - useGame for state management
 * - useAdminActions for user operations
 * - Button component for interactions
 * - Framer Motion for animations
 * 
 * Icon Usage:
 * - User2Icon: Main profile icon
 * - ShieldIcon: Admin/moderator role indicator
 * - StarIcon: Premium role indicator
 * - Camera: Avatar upload indicator
 * - Edit2: Edit mode toggle
 * - Save: Save changes action
 * - CloseIcon: Cancel/close actions
 */
=======
    dispatch({
      type: 'SET_USER_ROLE',
      payload: newRoles
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold dark:text-white">User Profile</h3>
          <button
            onClick={() => setShowEditProfile(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Edit2 size={16} />
            <span>Edit Profile</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <img
            src={state.user.avatar}
            alt={state.user.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h4 className="font-semibold dark:text-white">{state.user.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">{state.user.title}</p>
            <div className="flex items-center space-x-2 mt-2">
              {state.user.roles?.map(role => (
                <span
                  key={role}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    role === 'admin'
                      ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                  }`}
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-600 rounded-lg">
            <div className="flex items-center space-x-3">
              <Shield className="text-indigo-500" size={20} />
              <span className="font-medium dark:text-white">Admin Access</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={state.user.roles?.includes('admin') || false}
                onChange={() => handleToggleRole(state.user.id, 'admin')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-600 rounded-lg">
            <div className="flex items-center space-x-3">
              <Star className="text-yellow-500" size={20} />
              <span className="font-medium dark:text-white">Premium Status</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={state.user.roles?.includes('premium') || false}
                onChange={() => handleToggleRole(state.user.id, 'premium')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showEditProfile && (
          <EditProfileModal
            onClose={() => setShowEditProfile(false)}
            onSave={handleUpdateProfile}
            initialData={{
              name: state.user.name,
              title: state.user.title || '',
              avatar: state.user.avatar || ''
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
