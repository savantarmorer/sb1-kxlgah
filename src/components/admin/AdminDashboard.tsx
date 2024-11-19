import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Users, Package, Trophy, Scroll, ShoppingBag, Code, Loader } from 'lucide-react';
import UserManager from './UserManager';
import ItemManager from './ItemManager';
import AchievementManager from './AchievementManager';
import QuestManager from './QuestManager';
import ShopManager from './ShopManager';
import VisualEditor from './VisualEditor';
import Statistics from './Statistics';
import { useGame } from '../../contexts/GameContext';
import { supabase } from '../../lib/supabase';

interface AdminDashboardProps {
  onClose: () => void;
}

type AdminView = 'users' | 'items' | 'achievements' | 'quests' | 'shop' | 'visual' | 'stats';

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState<AdminView>('stats');
  const { state, dispatch } = useGame();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const handleSave = async (data: any, type: string) => {
    setLoading(true);
    try {
      console.log('Saving data:', { type, data });

      // First, save to Supabase
      const { data: savedData, error } = await supabase
        .from(type)
        .upsert(data)
        .select()
        .single();

      if (error) throw error;

      // Then, update local state based on type
      switch (type) {
        case 'items':
          dispatch({ 
            type: data.id ? 'UPDATE_ITEM' : 'ADD_ITEM', 
            payload: savedData 
          });
          break;
        case 'achievements':
          dispatch({ 
            type: data.id ? 'UPDATE_ACHIEVEMENT' : 'ADD_ACHIEVEMENT', 
            payload: savedData 
          });
          break;
        case 'quests':
          dispatch({ 
            type: data.id ? 'UPDATE_QUEST' : 'ADD_QUEST', 
            payload: savedData 
          });
          break;
        default:
          console.warn('Unknown type:', type);
      }

      setNotification({ type: 'success', message: `${type} saved successfully!` });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error(`Error saving ${type}:`, error);
      setNotification({ type: 'error', message: `Error saving ${type}` });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from(type)
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state based on type
      switch (type) {
        case 'items':
          dispatch({ type: 'REMOVE_ITEM', payload: { id } });
          break;
        case 'achievements':
          dispatch({ type: 'REMOVE_ACHIEVEMENT', payload: id });
          break;
        case 'quests':
          dispatch({ type: 'REMOVE_QUEST', payload: id });
          break;
        default:
          console.warn('Unknown type:', type);
      }

      setNotification({ type: 'success', message: `${type} deleted successfully!` });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      setNotification({ type: 'error', message: `Error deleting ${type}` });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'items', label: 'Items', icon: Package },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'quests', label: 'Quests', icon: Scroll },
    { id: 'shop', label: 'Shop', icon: ShoppingBag },
    { id: 'visual', label: 'Visual Editor', icon: Code }
  ];

  const renderContent = () => {
    const commonProps = {
      onSave: handleSave,
      onDelete: handleDelete,
      loading: loading
    };

    switch (currentView) {
      case 'users':
        return <UserManager {...commonProps} />;
      case 'items':
        return <ItemManager {...commonProps} />;
      case 'achievements':
        return <AchievementManager {...commonProps} />;
      case 'quests':
        return <QuestManager {...commonProps} />;
      case 'shop':
        return <ShopManager {...commonProps} />;
      case 'visual':
        return <VisualEditor />;
      case 'stats':
        return <Statistics />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden relative"
      >
        {/* Notification */}
        {notification && (
          <div 
            className={`absolute top-0 left-0 right-0 p-3 text-center text-white ${
              notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold dark:text-white">Admin Dashboard</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as AdminView)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <Loader className="animate-spin text-white" size={32} />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}