import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scroll, Plus, Edit, Trash2, Save, Clock } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { Quest, QuestType } from '../../types/quests';
import { supabase } from '../../lib/supabase';
import Button from '../Button';
import { NotificationSystem } from '../../utils/notifications';

export default function QuestManager() {
  const { state, dispatch } = useGame();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Quest>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setQuests(data);
        // Sync with game state
        dispatch({ type: 'SYNC_QUESTS', payload: data });
      }
    } catch (error) {
      console.error('Error loading quests:', error);
      NotificationSystem.showError('Failed to load quests');
    }
  };

  const handleEdit = (quest: Quest) => {
    setEditingId(quest.id);
    setEditForm(quest);
  };

  const handleSave = async () => {
    if (!editForm.id) return;
    setLoading(true);

    try {
      const updatedQuest: Quest = {
        id: editForm.id,
        title: editForm.title || '',
        description: editForm.description || '',
        type: editForm.type || 'daily',
        status: editForm.status || 'available',
        xpReward: editForm.xpReward || 0,
        coinReward: editForm.coinReward || 0,
        requirements: editForm.requirements || [],
        category: editForm.category || 'general',
        order: editForm.order || 0,
        is_active: true,
        created_at: editForm.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('quests')
        .upsert(updatedQuest);

      if (error) throw error;

      // Update local state
      setQuests(prev => prev.map(q => q.id === updatedQuest.id ? updatedQuest : q));
      
      // Update game state
      dispatch({
        type: 'UPDATE_QUEST',
        payload: updatedQuest
      });

      NotificationSystem.showSuccess('Quest updated successfully');
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Error saving quest:', error);
      NotificationSystem.showError('Failed to save quest');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this quest?')) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('quests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setQuests(prev => prev.filter(q => q.id !== id));
      
      // Update game state
      dispatch({
        type: 'REMOVE_QUEST',
        payload: id
      });

      NotificationSystem.showSuccess('Quest deleted successfully');
    } catch (error) {
      console.error('Error deleting quest:', error);
      NotificationSystem.showError('Failed to delete quest');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const newQuest: Quest = {
      id: `quest_${Date.now()}`,
      title: 'New Quest',
      description: 'Quest description',
      type: 'daily',
      status: 'available',
      xpReward: 100,
      coinReward: 50,
      requirements: [],
      category: 'general',
      order: quests.length,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('quests')
        .insert([newQuest]);

      if (error) throw error;

      // Update local state
      setQuests(prev => [...prev, newQuest]);
      
      // Update game state
      dispatch({
        type: 'ADD_QUEST',
        payload: newQuest
      });

      NotificationSystem.showSuccess('Quest created successfully');
      handleEdit(newQuest);
    } catch (error) {
      console.error('Error adding quest:', error);
      NotificationSystem.showError('Failed to create quest');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white">Quest Manager</h2>
        <Button
          variant="primary"
          onClick={handleAdd}
          icon={<Plus size={20} />}
          disabled={loading}
        >
          Add Quest
        </Button>
      </div>

      <div className="space-y-4">
        {quests.map(quest => (
          <motion.div
            key={quest.id}
            layout
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
          >
            {editingId === quest.id ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Quest Title"
                />
                <textarea
                  value={editForm.description || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Quest Description"
                />
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={editForm.type || 'daily'}
                    onChange={e => setEditForm(prev => ({ ...prev, type: e.target.value as QuestType }))}
                    className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="achievement">Achievement</option>
                    <option value="story">Story</option>
                  </select>
                  <input
                    type="number"
                    value={editForm.xpReward || 0}
                    onChange={e => setEditForm(prev => ({ ...prev, xpReward: parseInt(e.target.value) }))}
                    className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="XP Reward"
                  />
                  <input
                    type="number"
                    value={editForm.coinReward || 0}
                    onChange={e => setEditForm(prev => ({ ...prev, coinReward: parseInt(e.target.value) }))}
                    className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Coin Reward"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setEditForm({});
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    icon={<Save size={20} />}
                    disabled={loading}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold dark:text-white">{quest.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{quest.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <Scroll size={16} className="text-indigo-500" />
                      <span className="text-sm">{quest.type}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={16} className="text-green-500" />
                      <span className="text-sm">{quest.xpReward} XP</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {quest.coinReward} Coins
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleEdit(quest)}
                    icon={<Edit size={20} />}
                    disabled={loading}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(quest.id)}
                    icon={<Trash2 size={20} />}
                    disabled={loading}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}