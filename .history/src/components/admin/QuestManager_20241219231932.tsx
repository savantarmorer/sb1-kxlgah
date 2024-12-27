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
import { useGame } from '../../contexts/GameContext';
import { QuestService } from '../../services/questService';

interface QuestManagerState {
  showEditor: boolean;
  selectedQuest?: Quest;
  isLoading: boolean;
  error: string | null;
}

interface CreateQuestDialogProps {
  open: boolean;
  onClose: () => void;
  onQuestCreated: (quest: Partial<Quest>) => Promise<void>;
}

export default function QuestManager() {
  const { state, dispatch } = useGame();
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

  const handleCreateQuest = async (questData: Partial<Quest>) => {
    try {
      setManagerState(prev => ({ ...prev, isLoading: true }));
      const newQuest = await QuestService.createQuest(questData);
      await QuestService.assignQuestToUser(state.user.id, newQuest.id);
      await syncQuests();
      showSuccess('Quest created and assigned successfully');
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating quest:', error);
      showError('Failed to create quest');
    } finally {
      setManagerState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleAssignQuest = (questId: string) => {
    setSelectedQuestId(questId);
    setShowAssignDialog(true);
  };

  const handleEditQuest = (quest: Quest) => {
    setManagerState(prev => ({
      ...prev,
      showEditor: true,
      selectedQuest: quest,
    }));
  };

  const handleDeleteQuest = async (questId: string) => {
    try {
      setManagerState(prev => ({ ...prev, isLoading: true }));
      await QuestService.deleteQuest(questId);
      await syncQuests();
      showSuccess('Quest deleted successfully');
    } catch (error) {
      console.error('Error deleting quest:', error);
      showError('Error deleting quest');
    } finally {
      setManagerState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleSaveQuest = async (updatedQuest: Partial<Quest>) => {
    try {
      setManagerState(prev => ({ ...prev, isLoading: true }));
      if (updatedQuest.id) {
        await QuestService.updateQuest(updatedQuest.id, updatedQuest);
      }
      await syncQuests();
      setManagerState(prev => ({ ...prev, showEditor: false, selectedQuest: undefined }));
      showSuccess('Quest updated successfully');
    } catch (error) {
      console.error('Error updating quest:', error);
      showError('Error updating quest');
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
          onClick={() => setShowCreateDialog(true)}
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
            {state.quests?.active.map((quest: Quest) => (
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
        onQuestCreated={handleCreateQuest}
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