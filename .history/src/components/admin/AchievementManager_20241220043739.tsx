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
  CircularProgress,
  Paper,
} from '@mui/material';
import { Edit, Trash2, Plus, Award } from 'lucide-react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Achievement, AchievementReward, AchievementMilestone } from '../../types/achievements';
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

interface AchievementFormData extends Partial<Achievement> {
  created_at?: string;
  updated_at?: string;
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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

  const handleCreateAchievement = async (
    achievementData: Partial<Achievement>,
    rewards: { type: string; value: number }[],
    milestones: { progress: number; description: string; reward: { type: string; value: number } }[]
  ) => {
    try {
      setLoading(true);
      const newAchievement = await AchievementService.create({
        ...achievementData,
        metadata: {
          icon: achievementData.metadata?.icon || '🏆'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (!newAchievement || !newAchievement.id) {
        throw new Error('Failed to create achievement');
      }

      // Save rewards
      for (const reward of rewards) {
        await AchievementService.addReward(newAchievement.id, reward);
      }

      // Save milestones and their rewards
      for (const milestone of milestones) {
        const newMilestone = await AchievementService.addMilestone(newAchievement.id, {
          progress: milestone.progress,
          description: milestone.description
        });
        if (newMilestone && newMilestone.id) {
          await AchievementService.addMilestoneReward(newMilestone.id, milestone.reward);
        }
      }

      setAchievements(prev => [...prev, newAchievement]);
      toast.success('Achievement created successfully');
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating achievement:', error);
      toast.error('Failed to create achievement');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAchievement = async (
    achievementData: Partial<Achievement>,
    rewards: { type: string; value: number }[],
    milestones: { progress: number; description: string; reward: { type: string; value: number } }[]
  ) => {
    if (!selectedAchievement?.id) return;

    try {
      setLoading(true);
      const updatedAchievement = {
        ...selectedAchievement,
        ...achievementData,
        metadata: {
          ...selectedAchievement.metadata,
          ...achievementData.metadata
        },
        updated_at: new Date().toISOString()
      };

      await AchievementService.update(selectedAchievement.id, updatedAchievement);

      // Update rewards
      await AchievementService.clearRewards(selectedAchievement.id);
      for (const reward of rewards) {
        await AchievementService.addReward(selectedAchievement.id, reward);
      }

      // Update milestones
      await AchievementService.clearMilestones(selectedAchievement.id);
      for (const milestone of milestones) {
        const newMilestone = await AchievementService.addMilestone(selectedAchievement.id, {
          progress: milestone.progress,
          description: milestone.description
        });
        if (newMilestone && newMilestone.id) {
          await AchievementService.addMilestoneReward(newMilestone.id, milestone.reward);
        }
      }

      setAchievements(prev => 
        prev.map(a => a.id === selectedAchievement.id ? updatedAchievement : a)
      );
      toast.success('Achievement updated successfully');
      handleCloseDialog();
    } catch (error) {
      console.error('Error updating achievement:', error);
      toast.error('Failed to update achievement');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedAchievement(null);
  };

  const handleEditClick = async (achievement: Achievement) => {
    try {
      const achievementRewards = await AchievementService.getRewards(achievement.id);
      const achievementMilestones = await AchievementService.getMilestones(achievement.id);
      
      setSelectedAchievement({
        ...achievement,
        rewards: achievementRewards,
        milestones: achievementMilestones
      });
      setEditDialogOpen(true);
    } catch (error) {
      console.error('Error loading achievement details:', error);
      toast.error('Failed to load achievement details');
    }
  };

  const handleDeleteClick = (achievement: Achievement) => {
    if (window.confirm(`Are you sure you want to delete "${achievement.title}"?`)) {
      handleDeleteAchievement(achievement.id);
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    try {
      await AchievementService.delete(id);
      setAchievements(prev => prev.filter(a => a.id !== id));
      toast.success('Achievement deleted successfully');
    } catch (error) {
      console.error('Error deleting achievement:', error);
      toast.error('Failed to delete achievement');
    }
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Achievement Manager</Typography>
        <Button
          startIcon={<Plus size={18} />}
          variant="contained"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          Create Achievement
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Points</TableCell>
                <TableCell>Rarity</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {achievements.map((achievement) => (
                <TableRow key={achievement.id}>
                  <TableCell>{achievement.title}</TableCell>
                  <TableCell>{achievement.description}</TableCell>
                  <TableCell>{achievement.category}</TableCell>
                  <TableCell>{achievement.points}</TableCell>
                  <TableCell>{achievement.rarity}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEditClick(achievement)}
                      title="Edit"
                    >
                      <Edit size={18} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(achievement)}
                      title="Delete"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CreateAchievementDialog
        achievement={selectedAchievement}
        onClose={handleCloseDialog}
        onSubmit={selectedAchievement ? handleEditAchievement : handleCreateAchievement}
        open={isCreateDialogOpen || editDialogOpen}
      />
    </Box>
  );
}
