import React, { useEffect, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { use_language } from '../contexts/LanguageContext';
import { QuestType, QuestStatus, type Quest } from '../types/quests';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestComponent } from './Quest';
import { useNotification } from '../contexts/NotificationContext';
import { QuestManager } from '../services/QuestManager';

export default function QuestSystem() {
  const { state, dispatch } = useGame();
  const { t } = use_language();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    in_progress: 0,
    available: 0
  });

  useEffect(() => {
    loadQuestData();
  }, [state.user?.id]);

  const loadQuestData = async () => {
    if (!state.user?.id) return;
    
    try {
      setLoading(true);
      // Load quest stats
      const questStats = await QuestManager.getQuestStats(state.user.id);
      setStats(questStats);
    } catch (error) {
      console.error('Error loading quest data:', error);
      showError('Failed to load quest data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuest = async (quest: Quest) => {
    if (!state.user?.id) return;
    
    try {
      setLoading(true);
      await QuestManager.acceptQuest(state.user.id, quest.id);
      showSuccess('Quest accepted!');
      loadQuestData();
    } catch (error) {
      console.error('Error accepting quest:', error);
      showError('Failed to accept quest');
    } finally {
      setLoading(false);
    }
  };

  const handleAbandonQuest = async (quest: Quest) => {
    if (!state.user?.id) return;
    
    try {
      setLoading(true);
      await QuestManager.abandonQuest(state.user.id, quest.id);
      showSuccess('Quest abandoned');
      loadQuestData();
    } catch (error) {
      console.error('Error abandoning quest:', error);
      showError('Failed to abandon quest');
    } finally {
      setLoading(false);
    }
  };

  const activeQuests = state.quests?.active || [];
  const completedQuests = state.quests?.completed || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">
          {t('quests.title')}
        </h1>
        <div className="flex space-x-4">
          <div className="bg-indigo-900/50 rounded-lg p-3">
            <span className="text-sm text-indigo-200">Total Quests</span>
            <p className="text-2xl font-bold text-indigo-400">{stats.total}</p>
          </div>
          <div className="bg-green-900/50 rounded-lg p-3">
            <span className="text-sm text-green-200">Completed</span>
            <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
          </div>
          <div className="bg-yellow-900/50 rounded-lg p-3">
            <span className="text-sm text-yellow-200">In Progress</span>
            <p className="text-2xl font-bold text-yellow-400">{stats.in_progress}</p>
          </div>
        </div>
      </div>

      {/* Active Quests */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-semibold text-white">
          {t('quests.active')}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {activeQuests.map((quest) => (
              <motion.div
                key={quest.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <QuestComponent
                  quest={quest}
                  onAccept={handleAcceptQuest}
                  onAbandon={handleAbandonQuest}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Completed Quests */}
      {completedQuests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-semibold text-white">
            {t('quests.completed')}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {completedQuests.map((quest) => (
                <motion.div
                  key={quest.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  <QuestComponent quest={quest} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="bg-gray-900 rounded-lg p-6 shadow-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
              <p className="mt-4 text-white">Loading...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}