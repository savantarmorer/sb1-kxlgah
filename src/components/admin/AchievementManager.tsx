import React, { useState, useEffect } from "react";
import {
  Box,
  IconButton,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  SelectChangeEvent,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { supabase } from "../../lib/supabase";
import { useNotification } from "../../contexts/NotificationContext";
import { Achievement, AchievementRarity, AchievementTrigger, AchievementTriggerType } from "../../types/achievements";

interface EditForm {
  title: string;
  description: string;
  category: string;
  points: number;
  rarity: AchievementRarity;
  prerequisites: string[];
  dependents: string[];
  trigger_conditions: AchievementTrigger[];
  order: number;
}

const initialTriggerCondition: AchievementTrigger = {
  type: 'xp_gained' as AchievementTriggerType,
  value: 0,
  comparison: 'gte',
  metadata: {}
};

const initialForm: EditForm = {
  title: "",
  description: "",
  category: "",
  points: 0,
  rarity: "common",
  prerequisites: [],
  dependents: [],
  trigger_conditions: [initialTriggerCondition],
  order: 0
};

export function AchievementManager() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(initialForm);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("order", { ascending: true });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error("Error loading achievements:", error);
      showError("Failed to load achievements");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const achievementData: Partial<Achievement> = {
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        points: editForm.points,
        rarity: editForm.rarity,
        unlocked: false,
        unlocked_at: undefined,
        prerequisites: editForm.prerequisites,
        dependents: editForm.dependents,
        trigger_conditions: editForm.trigger_conditions,
        order: editForm.order
      };

      const { error } = await supabase
        .from("achievements")
        .upsert(editing ? { ...achievementData, id: editing } : achievementData)
        .select();

      if (error) throw error;

      showSuccess(editing ? "Achievement updated" : "Achievement created");
      setEditing(null);
      loadAchievements();
    } catch (error) {
      console.error("Error saving achievement:", error);
      showError("Failed to save achievement");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (achievement: Achievement) => {
    setEditing(achievement.id);
    setEditForm({
      title: achievement.title,
      description: achievement.description,
      category: achievement.category,
      points: achievement.points,
      rarity: achievement.rarity,
      prerequisites: achievement.prerequisites,
      dependents: achievement.dependents,
      trigger_conditions: achievement.trigger_conditions,
      order: achievement.order
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this achievement?")) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("achievements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      showSuccess("Achievement deleted");
      loadAchievements();
    } catch (error) {
      console.error("Error deleting achievement:", error);
      showError("Failed to delete achievement");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditing("new");
    setEditForm({
      ...initialForm,
      order: achievements.length
    });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'points' || name === 'order' ? Number(value) : value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Achievement Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={loading}
        >
          Add Achievement
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Rarity</TableCell>
              <TableCell>Points</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {achievements.map((achievement) => (
              <TableRow key={achievement.id}>
                {editing === achievement.id ? (
                  <>
                    <TableCell>
                      <TextField
                        fullWidth
                        name="title"
                        value={editForm.title}
                        onChange={handleTextChange}
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl fullWidth>
                        <Select
                          name="category"
                          value={editForm.category}
                          onChange={handleSelectChange}
                        >
                          <MenuItem value="study">Study</MenuItem>
                          <MenuItem value="battle">Battle</MenuItem>
                          <MenuItem value="social">Social</MenuItem>
                          <MenuItem value="progress">Progress</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <FormControl fullWidth>
                        <Select
                          name="rarity"
                          value={editForm.rarity}
                          onChange={handleSelectChange}
                        >
                          <MenuItem value="common">Common</MenuItem>
                          <MenuItem value="rare">Rare</MenuItem>
                          <MenuItem value="epic">Epic</MenuItem>
                          <MenuItem value="legendary">Legendary</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        name="points"
                        value={editForm.points}
                        onChange={handleTextChange}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={handleSave} disabled={loading}>
                        <SaveIcon />
                      </IconButton>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{achievement.title}</TableCell>
                    <TableCell>{achievement.category}</TableCell>
                    <TableCell>{achievement.rarity}</TableCell>
                    <TableCell>{achievement.points}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(achievement)} sx={{ mr: 1 }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(achievement.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
