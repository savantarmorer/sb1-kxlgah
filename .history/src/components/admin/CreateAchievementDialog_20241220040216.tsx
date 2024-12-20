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

interface TriggerState extends TriggerCondition {
  type: AchievementTriggerType;
  value: number;
  comparison: 'eq' | 'gt' | 'gte' | 'lt' | 'lte';
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

interface RewardFormData {
  type: string;
  value: number;
}

interface MilestoneFormData {
  progress: number;
  description: string;
  reward: RewardFormData;
}

interface CreateAchievementDialogProps {
  achievement: Achievement | null;
  onClose: () => void;
  onSubmit: (achievement: Partial<Achievement>, rewards: RewardFormData[], milestones: MilestoneFormData[]) => void;
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
    trigger_conditions: achievement?.trigger_conditions || [],
    prerequisites: achievement?.prerequisites || [],
    dependents: achievement?.dependents || [],
  });
  const [rewards, setRewards] = React.useState<RewardFormData[]>([]);
  const [milestones, setMilestones] = React.useState<MilestoneFormData[]>([]);

  React.useEffect(() => {
    if (achievement) {
      setFormData({
        ...achievement,
        metadata: achievement.metadata || { icon: '🏆' },
        trigger_conditions: Array.isArray(achievement.trigger_conditions) 
          ? achievement.trigger_conditions 
          : []
      });
      // Load rewards and milestones if editing
      if (achievement.rewards) {
        setRewards(achievement.rewards);
      }
      if (achievement.milestones) {
        setMilestones(achievement.milestones);
      }
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
      setRewards([]);
      setMilestones([]);
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
        } as TriggerState
      ]
    }));
  };

  const handleRemoveTrigger = (index: number) => {
    setFormData(prev => ({
      ...prev,
      trigger_conditions: (prev.trigger_conditions || []).filter((_: TriggerState, i: number) => i !== index)
    }));
  };

  const handleUpdateTrigger = (index: number, field: keyof TriggerState, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      trigger_conditions: (prev.trigger_conditions || []).map((trigger: TriggerState, i: number) =>
        i === index ? { 
          ...trigger, 
          [field]: value,
          // Reset value to 0 when changing type to ensure valid state
          ...(field === 'type' ? { value: 0 } : {})
        } : trigger
      )
    }));
  };

  const handleAddReward = () => {
    setRewards([...rewards, { type: 'coins', value: 0 }]);
  };

  const handleRemoveReward = (index: number) => {
    setRewards(rewards.filter((_, i) => i !== index));
  };

  const handleUpdateReward = (index: number, updatedReward: RewardFormData) => {
    setRewards(rewards.map((reward, i) => i === index ? updatedReward : reward));
  };

  const handleAddMilestone = () => {
    setMilestones([...milestones, {
      progress: 0,
      description: '',
      reward: { type: 'coins', value: 0 }
    }]);
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleUpdateMilestone = (index: number, updatedMilestone: MilestoneFormData) => {
    setMilestones(milestones.map((milestone, i) => i === index ? updatedMilestone : milestone));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title || !formData.description || !formData.category) {
      return;
    }

    // Validate trigger conditions
    const validTriggers = (formData.trigger_conditions || []).filter((trigger: TriggerState) => 
      trigger.type && trigger.value !== undefined && trigger.comparison
    );

    if (validTriggers.length === 0) {
      return;
    }

    onSubmit({
      ...formData,
      trigger_conditions: validTriggers
    }, rewards, milestones);
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

        {/* Rewards Section */}
        <Box>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1">
              Rewards
            </Typography>
            <Button
              startIcon={<Plus size={18} />}
              onClick={handleAddReward}
              variant="outlined"
              size="small"
            >
              Add Reward
            </Button>
          </Box>

          {rewards.map((reward, index) => (
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
                onClick={() => handleRemoveReward(index)}
                sx={{ position: 'absolute', top: 8, right: 8 }}
              >
                <X size={18} />
              </IconButton>

              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={reward.type}
                    label="Type"
                    onChange={(e) => handleUpdateReward(index, { ...reward, type: e.target.value })}
                  >
                    <MenuItem value="coins">Coins</MenuItem>
                    <MenuItem value="gems">Gems</MenuItem>
                    <MenuItem value="xp">XP</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Value"
                  type="number"
                  value={reward.value}
                  onChange={(e) => handleUpdateReward(index, { ...reward, value: parseInt(e.target.value) })}
                  fullWidth
                />
              </Stack>
            </Box>
          ))}
        </Box>

        {/* Milestones Section */}
        <Box>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1">
              Milestones
            </Typography>
            <Button
              startIcon={<Plus size={18} />}
              onClick={handleAddMilestone}
              variant="outlined"
              size="small"
            >
              Add Milestone
            </Button>
          </Box>

          {milestones.map((milestone, index) => (
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
                onClick={() => handleRemoveMilestone(index)}
                sx={{ position: 'absolute', top: 8, right: 8 }}
              >
                <X size={18} />
              </IconButton>

              <Stack spacing={2}>
                <TextField
                  label="Progress Required (%)"
                  type="number"
                  value={milestone.progress}
                  onChange={(e) => handleUpdateMilestone(index, { ...milestone, progress: parseInt(e.target.value) })}
                  inputProps={{ min: 0, max: 100 }}
                  fullWidth
                />

                <TextField
                  label="Description"
                  value={milestone.description}
                  onChange={(e) => handleUpdateMilestone(index, { ...milestone, description: e.target.value })}
                  multiline
                  rows={2}
                  fullWidth
                />

                <Typography variant="subtitle2">Milestone Reward</Typography>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={milestone.reward.type}
                    label="Type"
                    onChange={(e) => handleUpdateMilestone(index, {
                      ...milestone,
                      reward: { ...milestone.reward, type: e.target.value }
                    })}
                  >
                    <MenuItem value="coins">Coins</MenuItem>
                    <MenuItem value="gems">Gems</MenuItem>
                    <MenuItem value="xp">XP</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Value"
                  type="number"
                  value={milestone.reward.value}
                  onChange={(e) => handleUpdateMilestone(index, {
                    ...milestone,
                    reward: { ...milestone.reward, value: parseInt(e.target.value) }
                  })}
                  fullWidth
                />
              </Stack>
            </Box>
          ))}
        </Box>
      </Stack>
    </form>
  );
} 