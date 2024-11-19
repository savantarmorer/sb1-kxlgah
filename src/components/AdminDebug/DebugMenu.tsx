import React from 'react';
import { motion } from 'framer-motion';
import { X, Bug, Zap, Database, RefreshCw } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import Button from '../Button';

interface DebugMenuProps {
  onClose: () => void;
}

export default function DebugMenu({ onClose }: DebugMenuProps) {
  const { state, dispatch } = useGame();

  const debugActions = [
    {
      label: 'Add 1000 XP',
      icon: <Zap size={16} />,
      action: () => dispatch({
        type: 'ADD_XP',
        payload: { amount: 1000, reason: 'Debug Action' }
      })
    },
    {
      label: 'Add 1000 Coins',
      icon: <Database size={16} />,
      action: () => dispatch({
        type: 'ADD_COINS',
        payload: 1000
      })
    },
    {
      label: 'Reset Progress',
      icon: <RefreshCw size={16} />,
      action: () => {
        if (window.confirm('Are you sure you want to reset all progress?')) {
          localStorage.clear();
          window.location.reload();
        }
      }
    }
  ];

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
          <div className="flex items-center space-x-2">
            <Bug className="text-purple-500" size={24} />
            <h2 className="text-2xl font-bold dark:text-white">Debug Menu</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          {debugActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={action.action}
              className="w-full justify-start"
              icon={action.icon}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}