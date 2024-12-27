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

  const handleCreateAchievement = async (achievement: AchievementFormData) => {
    try {
      const newAchievement = await AchievementService.create(achievement);

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
        await AchievementService.addMilestoneReward(newMilestone.id, milestone.reward);
      }

      setAchievements(prev => [...prev, newAchievement]);
      toast.success('Achievement created successfully');
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating achievement:', error);
      toast.error('Failed to create achievement');
    }
  };

  const handleEditAchievement = async (achievement: Achievement) => {
    try {
      await AchievementService.update(achievement.id, achievement);

      // Update rewards
      await AchievementService.clearRewards(achievement.id);
      for (const reward of rewards) {
        await AchievementService.addReward(achievement.id, reward);
      }

      // Update milestones
      await AchievementService.clearMilestones(achievement.id);
      for (const milestone of milestones) {
        const newMilestone = await AchievementService.addMilestone(achievement.id, {
          progress: milestone.progress,
          description: milestone.description
        });
        await AchievementService.addMilestoneReward(newMilestone.id, milestone.reward);
      }

      setAchievements(prev => 
        prev.map(a => a.id === achievement.id ? achievement : a)
      );
      toast.success('Achievement updated successfully');
      handleCloseDialog();
    } catch (error) {
      console.error('Error updating achievement:', error);
      toast.error('Failed to update achievement');
    }
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedAchievement(null);
    setRewards([]);
    setMilestones([]);
  };

  const handleEditClick = async (achievement: Achievement) => {
    try {
      const achievementRewards = await AchievementService.getRewards(achievement.id);
      const achievementMilestones = await AchievementService.getMilestones(achievement.id);
      
      setRewards(achievementRewards);
      setMilestones(achievementMilestones.map(m => ({
        progress: m.progress,
        description: m.description || '',
        reward: m.reward || { type: 'coins', value: 0 }
      })));
      
      setSelectedAchievement(achievement);
      setEditDialogOpen(true);
    } catch (error) {
      console.error('Error loading achievement details:', error);
      toast.error('Failed to load achievement details');
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this achievement?')) return;

    try {
      await AchievementService.delete(id);
      setAchievements(prev => prev.filter(a => a.id !== id));
      toast.success('Achievement deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete achievement';
      toast.error(errorMessage);
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
                <TableCell>{achievement.category}</TableCell>
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
                      onClick={() => handleEditClick(achievement)}
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

      <Dialog 
        open={isCreateDialogOpen || editDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedAchievement ? 'Edit Achievement' : 'Create Achievement'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <CreateAchievementDialog
              achievement={selectedAchievement}
              onClose={handleCloseDialog}
              onSubmit={selectedAchievement ? handleEditAchievement : handleCreateAchievement}
            />

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                Rewards
              </Typography>
              {rewards.map((reward, index) => (
                <Box key={index} sx={{ mb: 2, display: 'flex', gap: 2 }}>
                  <RewardForm
                    reward={reward}
                    onChange={(newReward) => {
                      const newRewards = [...rewards];
                      newRewards[index] = newReward;
                      setRewards(newRewards);
                    }}
                  />
                  <IconButton 
                    color="error" 
                    onClick={() => handleRemoveReward(index)}
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
                <Box key={index} sx={{ mb: 2 }}>
                  <MilestoneForm
                    milestone={milestone}
                    onChange={(newMilestone) => {
                      const newMilestones = [...milestones];
                      newMilestones[index] = newMilestone;
                      setMilestones(newMilestones);
                    }}
                  />
                  <Button
                    color="error"
                    onClick={() => handleRemoveMilestone(index)}
                    startIcon={<DeleteIcon />}
                  >
                    Remove Milestone
                  </Button>
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
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => selectedAchievement ? 
              handleEditAchievement(selectedAchievement) : 
              handleCreateAchievement({})
            }
          >
            {selectedAchievement ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
