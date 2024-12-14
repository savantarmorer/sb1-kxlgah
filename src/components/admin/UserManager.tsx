import React, { useState, useEffect } from 'react';
import {
  Box,
  Badge,
  IconButton,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { supabase } from '../../lib/supabase.ts';
import { useNotification } from '../../contexts/NotificationContext';
import { Database } from '../../types/supabase';
import { GameState } from '../../types/game';

interface User {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  created_at: string;
  updated_at: string;
  is_super_admin: boolean;
}

interface UserManagerProps {
  state: GameState;
}

export const UserManager: React.FC<UserManagerProps> = ({ state }) => {
  const [users, setUsers] = useState<User[]>([]);
  const { showSuccess, showError } = useNotification();

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((data || []) as User[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      showError('Failed to fetch users.');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: User) => {
    // Implement edit functionality
    console.log('Edit user:', user);
  };

  const handleDelete = async (userId: string) => {
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
      showSuccess('User deleted successfully.');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showError('Failed to delete user.');
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Level</strong></TableCell>
              <TableCell><strong>XP</strong></TableCell>
              <TableCell><strong>Coins</strong></TableCell>
              <TableCell><strong>Streak</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {user.name}
                  </Typography>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.level}</TableCell>
                <TableCell>{user.xp}</TableCell>
                <TableCell>{user.coins}</TableCell>
                <TableCell>{user.streak}</TableCell>
                <TableCell>
                  <Badge
                    badgeContent={user.is_super_admin ? 'Admin' : 'User'}
                    color={user.is_super_admin ? 'error' : 'primary'}
                  />
                </TableCell>
                <TableCell>
                  <IconButton aria-label="edit" onClick={() => handleEdit(user)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton aria-label="delete" onClick={() => handleDelete(user.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};