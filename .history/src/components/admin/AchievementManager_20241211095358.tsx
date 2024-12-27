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
  Tooltip
} from '@mui/material';
import { Edit, Trash2, Plus, Award } from 'lucide-react';
import { Achievement } from '../../types/achievements';
import { AchievementService } from '../../services/achievementService';
import { CreateAchievementDialog } from './CreateAchievementDialog';
import { toast } from 'react-hot-toast';
import { ACHIEVEMENT_CATEGORIES } from '../../constants/achievements';

export function AchievementManager() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

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
      console.error('Error deleting achievement:', error);
      toast.error('Failed to delete achievement');
    }
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = ACHIEVEMENT_CATEGORIES.find(c => c.id === categoryId);
    return category?.label || categoryId;
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
    </Box>
  );
}
