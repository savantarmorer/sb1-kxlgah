import React, { useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Scroll, CheckCircle, Clock, XCircle } from 'lucide-react';
import { checkQuestRequirements, calculateQuestProgress } from '../utils/questUtils';
import Button from './Button';

export default function QuestSystem() {
  const { state, dispatch } = useGame();
  const { t } = useLanguage();

  useEffect(() => {
    // Update quest progress periodically
    const interval = setInterval(() => {
      state.quests.forEach(quest => {
        if (quest.status === 'in_progress') {
          const progress = calculateQuestProgress(quest, state.user);
          if (progress >= 100) {
            handleQuestComplete(quest.id);
          } else {
            dispatch({
              type: 'SYNC_QUEST_PROGRESS',
              payload: { questId: quest.id, progress }
            });
          }
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [state.quests, state.user]);

  const handleQuestComplete = async (questId: string) => {
    try {
      const { data: quest, error } = await supabase
        .from('quests')
        .update({ status: 'completed' })
        .eq('id', questId)
        .select()
        .single();

      if (error) throw error;

      dispatch({
        type: 'UPDATE_QUEST',
        payload: quest
      });

      // Add rewards
      dispatch({
        type: 'ADD_XP',
        payload: { amount: quest.xpReward, reason: 'Quest Completed' }
      });

      dispatch({
        type: 'ADD_COINS',
        payload: quest.coinReward
      });

      // Show notification
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'quest',
          message: quest
        }
      });

      // Check for achievements
      const achievements = checkQuestAchievements(state.quests);
      achievements.forEach(achievement => {
        dispatch({
          type: 'UNLOCK_ACHIEVEMENT',
          payload: achievement
        });
        
        dispatch({
          type: 'SHOW_NOTIFICATION',
          payload: {
            type: 'achievement',
            message: achievement
          }
        });
      });
    } catch (error) {
      console.error('Error completing quest:', error);
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'error',
          message: 'Failed to complete quest'
        }
      });
    }
  };

  const handleStartQuest = async (questId: string) => {
    try {
      const quest = state.quests.find(q => q.id === questId);
      if (!quest) return;

      if (!checkQuestRequirements(quest, state.user)) {
        dispatch({
          type: 'SHOW_NOTIFICATION',
          payload: {
            type: 'error',
            message: 'You do not meet the requirements for this quest!'
          }
        });
        return;
      }

      const { error } = await supabase
        .from('quests')
        .update({ status: 'in_progress' })
        .eq('id', questId);

      if (error) throw error;

      dispatch({
        type: 'UPDATE_QUEST',
        payload: { ...quest, status: 'in_progress' }
      });
    } catch (error) {
      console.error('Error starting quest:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-white">
          {t('quests.title')}
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {state.quests.filter(q => q.status === 'completed').length} / {state.quests.length} {t('quests.completed')}
        </div>
      </div>

      <div className="grid gap-4">
        {state.quests.map((quest) => (
          <motion.div
            key={quest.id}
            layout
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{quest.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {quest.description}
                </p>
                
                {quest.requirements && quest.requirements.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-medium">Requirements:</p>
                    {quest.requirements.map((req, index) => (
                      <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
                        • {req.description}: {req.value}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center space-x-1">
                    <Scroll size={16} className="text-yellow-500" />
                    <span className="text-sm">{quest.xpReward} XP</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Scroll size={16} className="text-yellow-500" />
                    <span className="text-sm">{quest.coinReward} Coins</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-2">
                <div className={`px-3 py-1 rounded-full text-sm ${
                  quest.status === 'completed' ? 'bg-green-100 text-green-800' :
                  quest.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  quest.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {quest.status}
                </div>

                {quest.status === 'available' && (
                  <Button
                    variant="primary"
                    onClick={() => handleStartQuest(quest.id)}
                    disabled={!checkQuestRequirements(quest, state.user)}
                  >
                    Start Quest
                  </Button>
                )}

                {quest.status === 'in_progress' && quest.progress !== undefined && (
                  <div className="w-full mt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{quest.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-blue-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${quest.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}