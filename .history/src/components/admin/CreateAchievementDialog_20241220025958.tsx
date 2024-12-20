import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
} from '@mui/material';
import { Achievement } from '../../types/achievements';

interface CreateAchievementDialogProps {
  achievement: Achievement | null;
  onClose: () => void;
  onSubmit: (achievement: Achievement) => void;
}

export function CreateAchievementDialog({ 
  achievement,
  onClose,
  onSubmit,
}: CreateAchievementDialogProps) {
  const [formData, setFormData] = React.useState<Achievement>({
    id: achievement?.id || '',
    title: achievement?.title || '',
    description: achievement?.description || '',
    category: achievement?.category || '',
    points: achievement?.points || 0,
    rarity: achievement?.rarity || 'common',
    unlocked: achievement?.unlocked || false,
    order_num: achievement?.order_num || 0,
    created_at: achievement?.created_at || new Date().toISOString(),
    updated_at: achievement?.updated_at || new Date().toISOString(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <TextField
          label="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          fullWidth
        />

        <TextField
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          multiline
          rows={3}
          required
          fullWidth
        />

        <FormControl fullWidth required>
          <InputLabel>Category</InputLabel>
          <Select
            value={formData.category}
            label="Category"
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <MenuItem value="general">General</MenuItem>
            <MenuItem value="battle">Battle</MenuItem>
            <MenuItem value="quiz">Quiz</MenuItem>
            <MenuItem value="study">Study</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Points"
          type="number"
          value={formData.points}
          onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
          required
          fullWidth
        />

        <FormControl fullWidth required>
          <InputLabel>Rarity</InputLabel>
          <Select
            value={formData.rarity}
            label="Rarity"
            onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
          >
            <MenuItem value="common">Common</MenuItem>
            <MenuItem value="rare">Rare</MenuItem>
            <MenuItem value="epic">Epic</MenuItem>
            <MenuItem value="legendary">Legendary</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Order Number"
          type="number"
          value={formData.order_num}
          onChange={(e) => setFormData({ ...formData, order_num: parseInt(e.target.value) })}
          required
          fullWidth
        />
      </Stack>
    </form>
  );
} 