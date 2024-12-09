import React, { useState, useContext } from 'react';
import {
  Box,
  IconButton,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Chip,
  Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAdminActions } from '../../hooks/useAdminActions';
import { useQuests } from '../../hooks/useQuests';
import { QuestEditor } from './QuestEditor';
import { CreateQuestDialog } from './CreateQuestDialog';
import { AssignQuestDialog } from './AssignQuestDialog';
import { Quest } from '../../types/quests';
import { useNotification } from '../../contexts/NotificationContext';
import { GameContext } from '../../contexts/GameContext';

interface QuestWithId extends Quest {
  id: string;
}

interface QuestManagerState {
  showEditor: boolean;
  selectedQuest?: QuestWithId;
  isLoading: boolean;
  error: string | null;
}

export default function QuestManager() {
  const { state } = useContext(GameContext);
  const { saveQuest } = useAdminActions();
  const { syncQuests } = useQuests();
  const { showSuccess, showError } = useNotification();
  
  const [managerState, setManagerState] = useState<QuestManagerState>({
    showEditor: false,
    selectedQuest: undefined,
    isLoading: false,
    error: null,
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);

  const handleCreateQuest = () => {
    setShowCreateDialog(true);
  };

  const handleAssignQuest = (questId: string) => {
    setSelectedQuestId(questId);
    setShowAssignDialog(true);
  };

  const handleEditQuest = (quest: QuestWithId) => {
    setManagerState(prev => ({
      ...prev,
      showEditor: true,
      selectedQuest: quest,
    }));
  };

  const handleDeleteQuest = async (questId: string) => {
    try {
      setManagerState(prev => ({ ...prev, isLoading: true }));
      await saveQuest({ id: questId, is_active: false });
      await syncQuests();
      showSuccess('Quest deleted successfully');
    } catch (error) {
      console.error('Error deleting quest:', error);
      showError('Error deleting quest');
    } finally {
      setManagerState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleSaveQuest = async (quest: Partial<Quest>) => {
    try {
      setManagerState(prev => ({ ...prev, isLoading: true }));
      await saveQuest(quest);
      await syncQuests();
      setManagerState(prev => ({
        ...prev,
        showEditor: false,
        selectedQuest: undefined,
      }));
      showSuccess('Quest saved successfully');
    } catch (error) {
      console.error('Error saving quest:', error);
      showError('Error saving quest');
    } finally {
      setManagerState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Quest Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateQuest}
        >
          Create Quest
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Quest</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.quests?.active.map((quest: QuestWithId) => (
              <TableRow key={quest.id}>
                <TableCell>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {quest.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {quest.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={quest.type} />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={quest.is_active ? 'Active' : 'Inactive'} 
                    color={quest.is_active ? 'success' : 'error'} 
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleEditQuest(quest)}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleAssignQuest(quest.id)}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    <PersonAddIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteQuest(quest.id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateQuestDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onQuestCreated={syncQuests}
      />

      {selectedQuestId && (
        <AssignQuestDialog
          open={showAssignDialog}
          onClose={() => {
            setShowAssignDialog(false);
            setSelectedQuestId(null);
          }}
          questId={selectedQuestId}
        />
      )}

      {managerState.showEditor && managerState.selectedQuest && (
        <QuestEditor
          quest={managerState.selectedQuest}
          onSave={handleSaveQuest}
          onCancel={() => setManagerState(prev => ({
            ...prev,
            showEditor: false,
            selectedQuest: undefined,
          }))}
        />
      )}
    </Box>
  );
}