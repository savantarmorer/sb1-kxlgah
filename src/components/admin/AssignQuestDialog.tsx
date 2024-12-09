import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert
} from '@mui/material';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../contexts/NotificationContext';

interface AssignQuestDialogProps {
  open: boolean;
  onClose: () => void;
  questId: string;
}

export const AssignQuestDialog: React.FC<AssignQuestDialogProps> = ({
  open,
  onClose,
  questId
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      showError('Failed to load users');
    }
  };

  const handleAssign = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_quests')
        .insert({
          user_id: selectedUser,
          quest_id: questId,
          status: 'active',
          progress: 0
        });

      if (error) throw error;
      
      showSuccess('Quest assigned successfully');
      onClose();
    } catch (error) {
      console.error('Error assigning quest:', error);
      showError('Failed to assign quest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Quest to User</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Select User</InputLabel>
            <Select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              label="Select User"
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleAssign}
          disabled={!selectedUser || loading}
          variant="contained"
          color="primary"
        >
          Assign Quest
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 