import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Grid,
  SelectChangeEvent,
} from '@mui/material';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../contexts/NotificationContext';
import { Quest, QuestStatus } from '../../types/quests';

interface CreateQuestDialogProps {
  open: boolean;
  onClose: () => void;
  onQuestCreated: (quest: Partial<Quest>) => Promise<void>;
}

interface QuestFormData {
  title: string;
  description: string;
  type: string;
  category: string;
  xp_reward: number;
  coin_reward: number;
  requirements: any[];
}

const initialFormData: QuestFormData = {
  title: '',
  description: '',
  type: 'daily',
  category: 'study',
  xp_reward: 100,
  coin_reward: 50,
  requirements: [],
};

export const CreateQuestDialog: React.FC<CreateQuestDialogProps> = ({
  open,
  onClose,
  onQuestCreated
}) => {
  const [formData, setFormData] = useState<QuestFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quests')
        .insert({
          ...formData,
          is_active: true,
          status: QuestStatus.AVAILABLE,
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      showSuccess('Quest created successfully');
      if (data) {
        await onQuestCreated({
          ...formData,
          id: data.id,
          is_active: true,
          status: QuestStatus.AVAILABLE,
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      onClose();
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error creating quest:', error);
      showError('Failed to create quest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Quest</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleTextChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleTextChange}
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleSelectChange}
                  label="Type"
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="achievement">Achievement</MenuItem>
                  <MenuItem value="special">Special</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleSelectChange}
                  label="Category"
                >
                  <MenuItem value="study">Study</MenuItem>
                  <MenuItem value="battle">Battle</MenuItem>
                  <MenuItem value="social">Social</MenuItem>
                  <MenuItem value="progress">Progress</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="XP Reward"
                name="xp_reward"
                value={formData.xp_reward}
                onChange={handleTextChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Coin Reward"
                name="coin_reward"
                value={formData.coin_reward}
                onChange={handleTextChange}
                required
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !formData.title || !formData.description}
          variant="contained"
          color="primary"
        >
          Create Quest
        </Button>
      </DialogActions>
    </Dialog>
  );
};