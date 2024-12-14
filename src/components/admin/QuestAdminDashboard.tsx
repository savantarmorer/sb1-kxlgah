import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { QuestEditor } from './QuestEditor';
import { Quest } from '../../types/quests';
import { useAdminActions } from '../../hooks/useAdminActions';
import { useNotification } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabase.ts';

interface QuestAdminDashboardProps {
  quests: Quest[];
  onUpdateQuests: (quests: Quest[]) => void;
}

export const QuestAdminDashboard: React.FC<QuestAdminDashboardProps> = ({
  quests,
  onUpdateQuests
}) => {
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();
  const { saveQuest, deleteQuest } = useAdminActions();

  const loadQuests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      onUpdateQuests(data || []);
    } catch (error) {
      console.error('Error loading quests:', error);
      showError('Error loading quests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuests();
  }, []);

  const handleEditQuest = (quest: Quest) => {
    setSelectedQuest(quest);
  };

  const handleCreateQuest = () => {
    setSelectedQuest(null);
  };

  const handleSaveQuest = async (questData: Partial<Quest>) => {
    try {
      await saveQuest(questData);
      showSuccess('Quest saved successfully');
      loadQuests(); // Refresh quests list
    } catch (error) {
      showError('Error saving quest');
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    try {
      await deleteQuest(questId);
      showSuccess('Quest deleted successfully');
      loadQuests(); // Refresh quests list
    } catch (error) {
      showError('Error deleting quest');
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem' }}>Quest Management</h2>
        <button
          onClick={handleCreateQuest}
          disabled={loading}
          style={{
            backgroundColor: 'blue',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} style={{ marginRight: '8px' }} />
          Create Quest
        </button>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', backgroundColor: 'white' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f7fafc' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #edf2f7' }}>Title</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #edf2f7' }}>Type</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #edf2f7' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #edf2f7' }}>Rewards</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #edf2f7' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quests.map((quest) => (
              <tr key={quest.id}>
                <td style={{ padding: '1rem', borderBottom: '1px solid #f7fafc' }}>
                  <span style={{ fontWeight: 'bold' }}>{quest.title}</span>
                  <span style={{ fontSize: '0.875rem', color: '#4a5568' }}>{quest.description}</span>
                </td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #f7fafc' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem'
                  }}>{quest.type}</span>
                </td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #f7fafc' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: quest.is_active ? '#48bb78' : '#f56565',
                    color: 'white',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem'
                  }}>
                    {quest.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #f7fafc' }}>
                  <span>XP: {quest.xp_reward}</span><br />
                  <span>Coins: {quest.coin_reward}</span>
                </td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #f7fafc' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      aria-label="Edit quest"
                      onClick={() => handleEditQuest(quest)}
                      disabled={loading}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      aria-label="Delete quest"
                      onClick={() => handleDeleteQuest(quest.id)}
                      disabled={loading}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'red'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedQuest && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: 1000
            }}
            onClick={() => setSelectedQuest(null)}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              padding: '1rem',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              zIndex: 1001
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>
                {selectedQuest ? 'Edit Quest' : 'Create Quest'}
              </h2>
              <button
                onClick={() => setSelectedQuest(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>
            <QuestEditor
              quest={selectedQuest || undefined}
              onSave={handleSaveQuest}
              onCancel={() => setSelectedQuest(null)}
            />
          </div>
        </>
      )}
    </div>
  );
}; 