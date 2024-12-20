import React from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Typography,
  Box,
  Button,
  IconButton,
} from '@mui/material';
import { Achievement, TriggerCondition, AchievementTriggerType } from '../../types/achievements';
import { X, Plus } from 'lucide-react';

interface CreateAchievementDialogProps {
  achievement: Achievement | null;
  onClose: () => void;
  onSubmit: (achievement: Partial<Achievement>) => void;
}

const TRIGGER_TYPES: { value: AchievementTriggerType; label: string; description: string }[] = [
  { value: 'xp_gained', label: 'XP Gained', description: 'Total XP points earned' },
  { value: 'highest_streak', label: 'Highest Streak', description: 'Highest consecutive win streak' },
  { value: 'quests_completed', label: 'Quests Completed', description: 'Number of quests completed' },
  { value: 'battle_score', label: 'Battle Score', description: 'Score achieved in a single battle' },
  { value: 'battle_wins', label: 'Battle Wins', description: 'Total battles won' },
  { value: 'battle_streak', label: 'Battle Streak', description: 'Current battle win streak' },
  { value: 'battle_rating', label: 'Battle Rating', description: 'Battle rating achieved' },
  { value: 'reward_rarity', label: 'Reward Rarity', description: 'Rarity level of rewards earned (1-4)' },
  { value: 'login_days', label: 'Login Days', description: 'Consecutive days logged in' },
  { value: 'battles_played', label: 'Battles Played', description: 'Total battles participated in' },
  { value: 'level_reached', label: 'Level Reached', description: 'Player level reached' },
  { value: 'coins_earned', label: 'Coins Earned', description: 'Total coins earned' }
];

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
    trigger_conditions: achievement?.trigger_conditions || [],
    prerequisites: achievement?.prerequisites || [],
    dependents: achievement?.dependents || [],
  });

  React.useEffect(() => {
    if (achievement) {
      setFormData({
        ...achievement,
        metadata: achievement.metadata || { icon: '🏆' },
        trigger_conditions: Array.isArray(achievement.trigger_conditions) 
          ? achievement.trigger_conditions 
          : []
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
        trigger_conditions: [],
        prerequisites: [],
        dependents: [],
      });
    }
  }, [achievement]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title || !formData.description || !formData.category) {
      return;
    }

    // Validate trigger conditions
    const validTriggers = (formData.trigger_conditions || []).filter(trigger => 
      trigger.type && trigger.value !== undefined && trigger.comparison
    );

    if (validTriggers.length === 0) {
      return;
    }

    onSubmit({
      ...formData,
      trigger_conditions: validTriggers
    });
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

        <Box>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1">
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

              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={trigger.type}
                    label="Type"
                    onChange={(e) => handleUpdateTrigger(index, 'type', e.target.value)}
                  >
                    {TRIGGER_TYPES.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                    {TRIGGER_TYPES.find(t => t.value === trigger.type)?.description}
                  </Typography>
                </FormControl>

                <TextField
                  fullWidth
                  type="number"
                  label="Value"
                  value={trigger.value}
                  onChange={(e) => handleUpdateTrigger(index, 'value', parseInt(e.target.value))}
                />

                <FormControl fullWidth>
                  <InputLabel>Comparison</InputLabel>
                  <Select
                    value={trigger.comparison}
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
              </Stack>
            </Box>
          ))}
        </Box>
      </Stack>
    </form>
  );
} 