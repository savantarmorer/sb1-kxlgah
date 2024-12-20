import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Divider,
} from '@mui/material';
import { Edit, Trash2, Plus, Award, Add as AddIcon, Delete as DeleteIcon } from 'lucide-react';
import { Achievement } from '../../types/achievements';
import { AchievementService } from '../../services/achievementService';
import { CreateAchievementDialog } from './CreateAchievementDialog';
import { toast } from 'react-hot-toast';
import { ACHIEVEMENT_CATEGORIES } from '../../constants/achievements';

interface RewardFormData {
  type: string;
  value: number;
}

interface MilestoneFormData {
  progress: number;
  description: string;
  reward: RewardFormData;
}

const RewardForm = ({ reward, onChange }: { 
  reward: RewardFormData; 
  onChange: (reward: RewardFormData) => void;
}) => (
  <Stack direction="row" spacing={2} alignItems="center">
    <FormControl fullWidth>
      <InputLabel>Type</InputLabel>
      <Select
        value={reward.type}
        label="Type"
        onChange={(e) => onChange({ ...reward, type: e.target.value })}
      >
        <MenuItem value="coins">Coins</MenuItem>
        <MenuItem value="gems">Gems</MenuItem>
        <MenuItem value="xp">XP</MenuItem>
        <MenuItem value="title">Title</MenuItem>
        <MenuItem value="avatar">Avatar</MenuItem>
      </Select>
    </FormControl>
    <TextField
      label="Value"
      type="number"
      value={reward.value}
      onChange={(e) => onChange({ ...reward, value: parseInt(e.target.value) })}
      fullWidth
    />
  </Stack>
);

const MilestoneForm = ({ milestone, onChange }: {
  milestone: MilestoneFormData;
  onChange: (milestone: MilestoneFormData) => void;
}) => (
  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
    <Stack spacing={2}>
      <TextField
        label="Progress Required (%)"
        type="number"
        value={milestone.progress}
        onChange={(e) => onChange({ ...milestone, progress: parseInt(e.target.value) })}
        inputProps={{ min: 0, max: 100 }}
      />
      <TextField
        label="Description"
        value={milestone.description}
        onChange={(e) => onChange({ ...milestone, description: e.target.value })}
        multiline
        rows={2}
      />
      <Typography variant="subtitle2">Milestone Reward</Typography>
      <RewardForm
        reward={milestone.reward}
        onChange={(reward) => onChange({ ...milestone, reward })}
      />
    </Stack>
  </Box>
);

export function AchievementManager() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [rewards, setRewards] = useState<RewardFormData[]>([]);
  const [milestones, setMilestones] = useState<MilestoneFormData[]>([]);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const data = await AchievementService.getAll();
      setAchievements(data);
    } catch (error) {
      console.error('Error loading achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAchievement = async (achievement: Partial<Achievement>) => {
    try {
      const newAchievement = await AchievementService.create({
        ...achievement,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      setAchievements(prev => [...prev, newAchievement]);
      toast.success('Achievement created successfully');
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating achievement:', error);
      toast.error('Failed to create achievement');
    }
  };

  const handleEditAchievement = async (achievement: Achievement) => {
    try {
      await AchievementService.update(achievement.id, {
        ...achievement,
        updated_at: new Date().toISOString()
      });

      setAchievements(prev => 
        prev.map(a => a.id === achievement.id ? achievement : a)
      );
      toast.success('Achievement updated successfully');
      setIsCreateDialogOpen(false);
      setSelectedAchievement(null);
    } catch (error) {
      console.error('Error updating achievement:', error);
      toast.error('Failed to update achievement');
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this achievement?')) return;

    try {
      await AchievementService.delete(id);
      setAchievements(prev => prev.filter(a => a.id !== id));
      toast.success('Achievement deleted successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to delete achievement');
    }
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = ACHIEVEMENT_CATEGORIES.find(c => c.id === categoryId);
    return category?.label || categoryId;
  };

  const handleAddReward = () => {
    setRewards([...rewards, { type: 'coins', value: 0 }]);
  };

  const handleRemoveReward = (index: number) => {
    setRewards(rewards.filter((_, i) => i !== index));
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

  const handleSave = async () => {
    try {
      // Save achievement first
      const achievementResult = await AchievementService.create({
        ...formData,
        rewards,
        milestones
      });

      if (achievementResult) {
        toast.success('Achievement saved successfully');
        handleClose();
        onUpdate?.();
      }
    } catch (error) {
      toast.error('Failed to save achievement');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Achievement Manager
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => {
            setSelectedAchievement(null);
            setIsCreateDialogOpen(true);
          }}
        >
          Create Achievement
        </Button>
      </Box>

      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Points</TableCell>
              <TableCell>Rarity</TableCell>
              <TableCell>Order</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {achievements.map((achievement) => (
              <TableRow key={achievement.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Award className={`text-${achievement.rarity}-500`} size={20} />
                    <Typography>{achievement.title}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{getCategoryLabel(achievement.category)}</TableCell>
                <TableCell>{achievement.points}</TableCell>
                <TableCell>
                  <Typography
                    sx={{
                      color: achievement.rarity === 'legendary' ? 'warning.main' :
                             achievement.rarity === 'epic' ? 'secondary.main' :
                             achievement.rarity === 'rare' ? 'info.main' :
                             'text.secondary'
                    }}
                  >
                    {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                  </Typography>
                </TableCell>
                <TableCell>{achievement.order_num}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedAchievement(achievement);
                        setIsCreateDialogOpen(true);
                      }}
                    >
                      <Edit size={18} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteAchievement(achievement.id)}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateAchievementDialog
        open={isCreateDialogOpen}
        achievement={selectedAchievement}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setSelectedAchievement(null);
        }}
        onSubmit={selectedAchievement ? handleEditAchievement : handleCreateAchievement}
      />

      <Dialog open={isCreateDialogOpen} onClose={() => {
        setIsCreateDialogOpen(false);
        setSelectedAchievement(null);
      }} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedAchievement ? 'Edit Achievement' : 'Create Achievement'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Existing achievement fields */}
            
            <Divider />
            
            <Box>
              <Typography variant="h6" gutterBottom>
                Rewards
              </Typography>
              {rewards.map((reward, index) => (
                <Box key={index} sx={{ mb: 2, display: 'flex', gap: 2 }}>
                  <RewardForm
                    reward={reward}
                    onChange={(updated) => {
                      const newRewards = [...rewards];
                      newRewards[index] = updated;
                      setRewards(newRewards);
                    }}
                  />
                  <IconButton 
                    onClick={() => handleRemoveReward(index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddReward}
                variant="outlined"
                size="small"
              >
                Add Reward
              </Button>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                Milestones
              </Typography>
              {milestones.map((milestone, index) => (
                <Box key={index} sx={{ mb: 3, position: 'relative' }}>
                  <IconButton
                    onClick={() => handleRemoveMilestone(index)}
                    color="error"
                    sx={{ position: 'absolute', right: -8, top: -8 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                  <MilestoneForm
                    milestone={milestone}
                    onChange={(updated) => {
                      const newMilestones = [...milestones];
                      newMilestones[index] = updated;
                      setMilestones(newMilestones);
                    }}
                  />
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddMilestone}
                variant="outlined"
                size="small"
              >
                Add Milestone
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setIsCreateDialogOpen(false);
            setSelectedAchievement(null);
          }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
