import React, { useState } from 'react';
import { Button, TextField, Switch, FormControlLabel } from '@mui/material';
import { Quest } from '../../types/quests';
import { useNotification } from '../../contexts/NotificationContext';

interface QuestEditorProps {
  quest?: Quest;
  onSave: (quest: Partial<Quest>) => Promise<void>;
  onCancel: () => void;
}

interface QuestFormData {
  title: string;
  description: string;
  xp_reward: number;
  coin_reward: number;
  required_level: number;
  is_active: boolean;
}

export const QuestEditor: React.FC<QuestEditorProps> = ({ quest, onSave, onCancel }) => {
  const [formData, setFormData] = useState<QuestFormData>({
    title: quest?.title || '',
    description: quest?.description || '',
    xp_reward: quest?.xp_reward || 0,
    coin_reward: quest?.coin_reward || 0,
    required_level: quest?.required_level || 1,
    is_active: quest?.is_active || false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <TextField
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          fullWidth
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <TextField
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          multiline
          rows={4}
          fullWidth
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <TextField
          label="XP Reward"
          name="xp_reward"
          type="number"
          value={formData.xp_reward}
          onChange={handleChange}
          required
          fullWidth
          inputProps={{ min: 0 }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <TextField
          label="Coin Reward"
          name="coin_reward"
          type="number"
          value={formData.coin_reward}
          onChange={handleChange}
          required
          fullWidth
          inputProps={{ min: 0 }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <TextField
          label="Required Level"
          name="required_level"
          type="number"
          value={formData.required_level}
          onChange={handleChange}
          required
          fullWidth
          inputProps={{ min: 1 }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.is_active}
              onChange={handleChange}
              name="is_active"
              color="primary"
            />
          }
          label="Active"
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="contained" color="primary" type="submit">
          Save
        </Button>
      </div>
    </form>
  );
};