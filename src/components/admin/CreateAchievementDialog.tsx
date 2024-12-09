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

interface CreateAchievementDialogProps {
  open: boolean;
  onClose: () => void;
  onAchievementCreated: () => void;
}

interface AchievementFormData {
  title: string;
  description: string;
  category: string;
  points: number;
  rarity: string;
  prerequisites: any[];
  trigger_conditions: any[];
}

const initialFormData: AchievementFormData = {
  title: '',
  description: '',
  category: 'study',
  points: 100,
  rarity: 'common',
  prerequisites: [],
  trigger_conditions: [],
};

export const CreateAchievementDialog: React.FC<CreateAchievementDialogProps> = ({
  open,
  onClose,
  onAchievementCreated
}) => {
  const [formData, setFormData] = useState<AchievementFormData>(initialFormData);
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
      const { error } = await supabase
        .from('achievements')
        .insert({
          ...formData,
          unlocked: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      showSuccess('Achievement created successfully');
      onAchievementCreated();
      onClose();
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error creating achievement:', error);
      showError('Failed to create achievement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Achievement</DialogTitle>
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
              <FormControl fullWidth>
                <InputLabel>Rarity</InputLabel>
                <Select
                  name="rarity"
                  value={formData.rarity}
                  onChange={handleSelectChange}
                  label="Rarity"
                >
                  <MenuItem value="common">Common</MenuItem>
                  <MenuItem value="rare">Rare</MenuItem>
                  <MenuItem value="epic">Epic</MenuItem>
                  <MenuItem value="legendary">Legendary</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Points"
                name="points"
                value={formData.points}
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
          Create Achievement
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 