import React, { useState } from 'react';
import { Button, TextField, Switch, FormControlLabel, Typography, Box, Grid, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import { Quest, QuestRequirement, QuestType } from '../../types/quests';
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
  is_active: boolean;
  expires_in_days: number;
  objectives: QuestRequirement[];
}

export const QuestEditor: React.FC<QuestEditorProps> = ({ quest, onSave, onCancel }) => {
  const [formData, setFormData] = useState<QuestFormData>({
    title: quest?.title || '',
    description: quest?.description || '',
    xp_reward: quest?.xp_reward || 0,
    coin_reward: quest?.coin_reward || 0,
    is_active: quest?.is_active || false,
    expires_in_days: 1,
    objectives: quest?.requirements || []
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleObjectiveChange = (index: number, field: keyof QuestRequirement, value: any) => {
    const newObjectives = [...formData.objectives];
    newObjectives[index] = { ...newObjectives[index], [field]: value };
    setFormData(prev => ({ ...prev, objectives: newObjectives }));
  };

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      objectives: [...prev.objectives, {
        type: QuestType.STUDY,
        target: 0,
        amount: 0,
        current: 0,
        description: '',
        progress: 0
      }]
    }));
  };

  const removeObjective = (index: number) => {
    const newObjectives = formData.objectives.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, objectives: newObjectives }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + formData.expires_in_days);

    const questData: Partial<Quest> = {
      ...formData,
      expires_at: expires_at.toISOString(),
      requirements: formData.objectives.map(obj => ({
        type: obj.type,
        target: obj.target,
        amount: obj.amount,
        current: obj.current,
        description: obj.description,
        progress: obj.progress
      }))
    };

    await onSave(questData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        {quest ? 'Edit Quest' : 'Create New Quest'}
      </Typography>
      <Box className="space-y-4">
        <TextField
          label="Title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          required
          fullWidth
        />
        <TextField
          label="Description"
          name="description"
          type="text"
          value={formData.description}
          onChange={handleChange}
          required
          fullWidth
          multiline
          rows={4}
        />
        <Grid container spacing={2}>
          <Grid item xs={6}>
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
          </Grid>
          <Grid item xs={6}>
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
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={6}>
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
          </Grid>
          <Grid item xs={6}>
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
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label="Expires In (Days)"
              name="expires_in_days"
              type="number"
              value={formData.expires_in_days}
              onChange={handleChange}
              required
              fullWidth
              inputProps={{ min: 1 }}
            />
          </Grid>
        </Grid>

        <Typography variant="subtitle1" gutterBottom>
          Objectives
        </Typography>
        <Box className="space-y-4">
          {formData.objectives.map((obj, index) => (
            <Box key={index} className="border p-2 rounded">
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={3}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={obj.type}
                      label="Type"
                      onChange={(e) => handleObjectiveChange(index, 'type', e.target.value)}
                      required
                    >
                      <MenuItem value={QuestType.BATTLE}>Battle</MenuItem>
                      <MenuItem value={QuestType.STUDY}>Study</MenuItem>
                      <MenuItem value={QuestType.ACHIEVEMENT}>Achievement</MenuItem>
                      <MenuItem value={QuestType.STREAK}>Streak</MenuItem>
                      <MenuItem value={QuestType.COLLECTION}>Collection</MenuItem>
                      <MenuItem value={QuestType.SOCIAL}>Social</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    label="Target"
                    name="target"
                    type="number"
                    value={obj.target}
                    onChange={(e) => handleObjectiveChange(index, 'target', Number(e.target.value))}
                    required
                    fullWidth
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    label="Description"
                    name="description"
                    type="text"
                    value={obj.description}
                    onChange={(e) => handleObjectiveChange(index, 'description', e.target.value)}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={1}>
                  <IconButton onClick={() => removeObjective(index)} color="error">
                    <Delete />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          ))}
          <Button variant="outlined" startIcon={<Add />} onClick={addObjective}>
            Add Objective
          </Button>
        </Box>
      </Box>

      {/* Submit Buttons */}
      <Box className="flex justify-end mt-4 space-x-2">
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="contained" color="primary" type="submit">
          Save
        </Button>
      </Box>
    </form>
  );
};