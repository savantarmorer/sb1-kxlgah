import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Settings } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { useAdminActions } from '../../hooks/useAdminActions';
import QuestEditor from './QuestEditor';
import Button from '../Button';
import { Quest } from '../../types/quests';

type QuestWithId = Quest & Required<Pick<Quest, 'id'>>;

interface QuestManagerState {
  showEditor: boolean;
  selectedQuest?: QuestWithId;
  isLoading: boolean;
}

export default function QuestManager() {
  const { state } = useGame();
  const { saveQuest } = useAdminActions();
  const [localState, setLocalState] = useState<QuestManagerState>({
    showEditor: false,
    selectedQuest: undefined,
    isLoading: false
  });

  const handleEditQuest = (quest: Quest) => {
    setLocalState({
      ...localState,
      selectedQuest: quest as QuestWithId
    });
    setLocalState({
      ...localState,
      showEditor: true
    });
  };

  const handleAddQuest = () => {
    setLocalState({
      ...localState,
      selectedQuest: undefined,
      showEditor: true
    });
  };

  const handleSaveQuest = async (quest: Partial<Quest>) => {
    try {
      setLocalState({
        ...localState,
        isLoading: true
      });
      await saveQuest(quest);
      setLocalState({
        ...localState,
        showEditor: false
      });
    } catch (error) {
      console.error('Error saving quest:', error);
    } finally {
      setLocalState({
        ...localState,
        isLoading: false
      });
    }
  const [quests, setQuests] = useState<Quest[]>(() => {
    const saved = localStorage.getItem('quests');
    return saved ? JSON.parse(saved) : [];
  });
  const [newQuest, setNewQuest] = useState<Partial<Quest>>({
    type: 'daily',
    xpReward: 100,
    coinReward: 50,
    requirements: []
  });

  const addQuest = () => {
    if (!newQuest.title || !newQuest.description) return;

    const quest: Quest = {
      id: `quest_${Date.now()}`,
      title: newQuest.title,
      description: newQuest.description,
      xpReward: newQuest.xpReward || 100,
      coinReward: newQuest.coinReward || 50,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      type: newQuest.type || 'daily',
      requirements: newQuest.requirements || []
    };

    setQuests([...quests, quest]);
    setNewQuest({
      type: 'daily',
      xpReward: 100,
      coinReward: 50,
      requirements: []
    });
  };

  const removeQuest = (id: string) => {
    setQuests(quests.filter(quest => quest.id !== id));
  };

  const saveQuests = () => {
    localStorage.setItem('quests', JSON.stringify(quests));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white">Quest Management</h2>
        <Button
          variant="primary"
          onClick={handleAddQuest}
          icon={<Plus size={16} />}
        >
          Add Quest
        </Button>
      </div>

      <div className="grid gap-4">
        {state.quests?.map((quest) => (
          <motion.div
            key={quest.id}
            layout
            className="card"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{quest.title}</h3>
                <p className="text-sm text-muted">{quest.description}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`badge ${
                    quest.type === 'epic' ? 'badge-warning' :
                    quest.type === 'weekly' ? 'badge-info' :
                    'badge-success'
                  }`}>
                    {quest.type}
                  </span>
                  <span className="text-sm text-muted">
                    XP: {quest.xpReward} | Coins: {quest.coinReward}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditQuest(quest)}
                icon={<Settings size={16} />}
              >
                Edit
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {localState.showEditor && (
        <QuestEditor
          quest={localState.selectedQuest}
          onSave={handleSaveQuest}
          onClose={() => setLocalState({
            ...localState,
            showEditor: false
          })}
        />
      )}
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Add New Quest</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Quest Title"
            value={newQuest.title || ''}
            onChange={e => setNewQuest({ ...newQuest, title: e.target.value })}
            className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <select
            value={newQuest.type || 'daily'}
            onChange={e => setNewQuest({ ...newQuest, type: e.target.value as Quest['type'] })}
            className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="epic">Epic</option>
          </select>
          <div className="md:col-span-2">
            <textarea
              placeholder="Quest Description"
              value={newQuest.description || ''}
              onChange={e => setNewQuest({ ...newQuest, description: e.target.value })}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              rows={3}
            />
          </div>
          <input
            type="number"
            placeholder="XP Reward"
            value={newQuest.xpReward || ''}
            onChange={e => setNewQuest({ ...newQuest, xpReward: parseInt(e.target.value) })}
            className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <input
            type="number"
            placeholder="Coin Reward"
            value={newQuest.coinReward || ''}
            onChange={e => setNewQuest({ ...newQuest, coinReward: parseInt(e.target.value) })}
            className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <button
            onClick={addQuest}
            className="md:col-span-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Quest</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold dark:text-white">Quest List</h3>
          <button
            onClick={saveQuests}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Save size={20} />
            <span>Save Changes</span>
          </button>
        </div>
        <div className="space-y-4">
          {quests.map(quest => (
            <div
              key={quest.id}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium dark:text-white">{quest.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{quest.description}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm">
                    <span className="text-indigo-600 dark:text-indigo-400">
                      {quest.xpReward} XP
                    </span>
                    <span className="text-yellow-600 dark:text-yellow-400">
                      {quest.coinReward} Coins
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      quest.type === 'epic'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                        : quest.type === 'weekly'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                    }`}>
                      {quest.type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeQuest(quest.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}