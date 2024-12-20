import React from 'react';
import {
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
  onSubmit: (achievement: Partial<Achievement>) => void;
}

export function CreateAchievementDialog({ 
  achievement,
  onClose,
  onSubmit,
}: CreateAchievementDialogProps) {
  const [formData, setFormData] = React.useState<Partial<Achievement>>({
    id: achievement?.id || '',
    title: achievement?.title || '',
    description: achievement?.description || '',
    category: achievement?.category || '',
    points: achievement?.points || 0,
    rarity: achievement?.rarity || 'common',
    unlocked: achievement?.unlocked || false,
    order_num: achievement?.order_num || 0,
    metadata: achievement?.metadata || { icon: '🏆' },
  });

  React.useEffect(() => {
    if (achievement) {
      setFormData({
        ...achievement,
        metadata: achievement.metadata || { icon: '🏆' }
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: '',
        points: 0,
        rarity: 'common',
        unlocked: false,
        order_num: 0,
        metadata: { icon: '🏆' },
      });
    }
  }, [achievement]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form id="achievement-form" onSubmit={handleSubmit}>
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

        <TextField
          label="Icon"
          value={formData.metadata?.icon || '🏆'}
          onChange={(e) => setFormData({
            ...formData,
            metadata: { ...formData.metadata, icon: e.target.value }
          })}
          helperText="Use an emoji as the achievement icon"
          fullWidth
        />
      </Stack>
    </form>
  );
} 