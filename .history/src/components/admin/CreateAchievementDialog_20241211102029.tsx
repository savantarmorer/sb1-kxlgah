import React, { useState, useEffect } from 'react';
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
  Grid,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { Plus, X } from 'lucide-react';
import { Achievement, AchievementRarity, TriggerCondition } from '../../types/achievements';
import { ACHIEVEMENT_CATEGORIES } from '../../constants/achievements';
import { toast } from 'react-hot-toast';

interface CreateAchievementDialogProps {
  open: boolean;
  achievement: Achievement | null;
  onClose: () => void;
  onSubmit: (achievement: Partial<Achievement>) => void;
}

const initialFormState: Partial<Achievement> = {
  title: '',
  description: '',
  category: '',
  points: 0,
  rarity: 'common' as AchievementRarity,
  prerequisites: [],
  dependents: [],
  trigger_conditions: [],
  order_num: 0,
  metadata: {
    icon: '🏆'
  }
};

export function CreateAchievementDialog({
  open,
  achievement,
  onClose,
  onSubmit
}: CreateAchievementDialogProps) {
  const [formData, setFormData] = useState<Partial<Achievement>>(initialFormState);

  useEffect(() => {
    if (achievement) {
      setFormData({
        ...achievement,
        trigger_conditions: Array.isArray(achievement.trigger_conditions) 
          ? achievement.trigger_conditions 
          : []
      });
    } else {
      setFormData(initialFormState);
    }
  }, [achievement]);

  const handleChange = (field: keyof Achievement, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTrigger = () => {
    setFormData(prev => ({
      ...prev,
      trigger_conditions: [
        ...(prev.trigger_conditions || []),
        { 
          type: 'xp_gained', 
          value: 0, 
          comparison: 'gte' 
        } as TriggerCondition
      ]
    }));
  };

  const handleRemoveTrigger = (index: number) => {
    setFormData(prev => ({
      ...prev,
      trigger_conditions: (prev.trigger_conditions || []).filter((_, i) => i !== index)
    }));
  };

  const handleUpdateTrigger = (index: number, field: keyof TriggerCondition, value: any) => {
    setFormData(prev => ({
      ...prev,
      trigger_conditions: (prev.trigger_conditions || []).map((trigger, i) =>
        i === index ? { 
          ...trigger, 
          [field]: value,
          // Reset value to 0 when changing type to ensure valid state
          ...(field === 'type' ? { value: 0 } : {})
        } : trigger
      )
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.title || !formData.description || !formData.category) {
      return;
    }

    // Validate trigger conditions
    const validTriggers = (formData.trigger_conditions || []).filter(trigger => 
      trigger.type && trigger.value !== undefined && trigger.comparison
    );

    if (validTriggers.length === 0) {
      toast.error('At least one valid trigger condition is required');
      return;
    }

    // Ensure trigger_conditions is an array and metadata exists
    const achievement: Partial<Achievement> = {
      ...formData,
      trigger_conditions: validTriggers,
      metadata: {
        ...(formData.metadata || {}),
        icon: formData.metadata?.icon || '🏆'
      }
    };

    onSubmit(achievement);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {achievement ? 'Edit Achievement' : 'Create Achievement'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Title"
                value={formData.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={3}
                label="Description"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category || ''}
                  label="Category"
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  {ACHIEVEMENT_CATEGORIES.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Rarity</InputLabel>
                <Select
                  value={formData.rarity || 'common'}
                  label="Rarity"
                  onChange={(e) => handleChange('rarity', e.target.value)}
                >
                  <MenuItem value="common">Common</MenuItem>
                  <MenuItem value="rare">Rare</MenuItem>
                  <MenuItem value="epic">Epic</MenuItem>
                  <MenuItem value="legendary">Legendary</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="Points"
                value={formData.points || 0}
                onChange={(e) => handleChange('points', parseInt(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="Order"
                value={formData.order_num || 0}
                onChange={(e) => handleChange('order_num', parseInt(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Icon"
                value={formData.metadata?.icon || '🏆'}
                onChange={(e) => handleChange('metadata', { 
                  ...(formData.metadata || {}), 
                  icon: e.target.value 
                })}
                placeholder="Enter an emoji or icon"
                helperText="Use an emoji as the achievement icon"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Trigger Conditions
                </Typography>
                <Button
                  startIcon={<Plus size={18} />}
                  onClick={handleAddTrigger}
                  variant="outlined"
                  size="small"
                >
                  Add Trigger
                </Button>
              </Box>

              {(formData.trigger_conditions || []).map((trigger, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    position: 'relative'
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveTrigger(index)}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                  >
                    <X size={18} />
                  </IconButton>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Type</InputLabel>
                        <Select
                          value={trigger.type || 'xp_gained'}
                          label="Type"
                          onChange={(e) => handleUpdateTrigger(index, 'type', e.target.value)}
                        >
                          <MenuItem value="xp_gained">XP Gained</MenuItem>
                          <MenuItem value="highest_streak">Highest Streak</MenuItem>
                          <MenuItem value="quests_completed">Quests Completed</MenuItem>
                          <MenuItem value="battle_score">Battle Score</MenuItem>
                          <MenuItem value="battle_wins">Battle Wins</MenuItem>
                          <MenuItem value="battle_streak">Battle Streak</MenuItem>
                          <MenuItem value="battle_rating">Battle Rating</MenuItem>
                          <MenuItem value="reward_rarity">Reward Rarity</MenuItem>
                          <MenuItem value="login_days">Login Days</MenuItem>
                          <MenuItem value="battles_played">Battles Played</MenuItem>
                          <MenuItem value="level_reached">Level Reached</MenuItem>
                          <MenuItem value="coins_earned">Coins Earned</MenuItem>
                        </Select>
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                          {trigger.type === 'xp_gained' && 'Total XP points earned'} 
                          {trigger.type === 'highest_streak' && 'Highest consecutive win streak'}
                          {trigger.type === 'quests_completed' && 'Number of quests completed'}
                          {trigger.type === 'battle_score' && 'Score achieved in a single battle'}
                          {trigger.type === 'battle_wins' && 'Total battles won'}
                          {trigger.type === 'battle_streak' && 'Current battle win streak'}
                          {trigger.type === 'battle_rating' && 'Battle rating achieved'}
                          {trigger.type === 'reward_rarity' && 'Rarity level of rewards earned (1-4)'}
                          {trigger.type === 'login_days' && 'Consecutive days logged in'}
                          {trigger.type === 'battles_played' && 'Total battles participated in'}
                          {trigger.type === 'level_reached' && 'Player level reached'}
                          {trigger.type === 'coins_earned' && 'Total coins earned'}
                        </Typography>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Value"
                        value={trigger.value || 0}
                        onChange={(e) => handleUpdateTrigger(index, 'value', parseInt(e.target.value) || 0)}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Comparison</InputLabel>
                        <Select
                          value={trigger.comparison || 'eq'}
                          label="Comparison"
                          onChange={(e) => handleUpdateTrigger(index, 'comparison', e.target.value)}
                        >
                          <MenuItem value="eq">Equal to</MenuItem>
                          <MenuItem value="gt">Greater than</MenuItem>
                          <MenuItem value="gte">Greater than or equal</MenuItem>
                          <MenuItem value="lt">Less than</MenuItem>
                          <MenuItem value="lte">Less than or equal</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={!formData.title || !formData.description || !formData.category}
        >
          {achievement ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 