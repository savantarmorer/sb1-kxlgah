import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Edit, Trash2, Save, Shield, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../Button';

interface UserData {
  id: string;
  name: string;
  email: string;
  is_super_admin: boolean;
  level: number;
  xp: number;
  coins: number;
  created_at: string;
}

export default function UserManager() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserData>>({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleEdit = (user: UserData) => {
    setEditingId(user.id);
    setEditForm(user);
  };

  const handleSave = async () => {
    if (!editForm.id) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          is_super_admin: editForm.is_super_admin,
          level: editForm.level,
          xp: editForm.xp,
          coins: editForm.coins
        })
        .eq('id', editForm.id);

      if (error) throw error;

      await loadUsers();
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white">User Manager</h2>
      </div>

      <div className="space-y-4">
        {users.map(user => (
          <motion.div
            key={user.id}
            layout
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
          >
            {editingId === user.id ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="User Name"
                />
                <div className="flex space-x-4">
                  <input
                    type="number"
                    value={editForm.level || 1}
                    onChange={e => setEditForm(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                    className="w-24 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Level"
                  />
                  <input
                    type="number"
                    value={editForm.xp || 0}
                    onChange={e => setEditForm(prev => ({ ...prev, xp: parseInt(e.target.value) }))}
                    className="w-24 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="XP"
                  />
                  <input
                    type="number"
                    value={editForm.coins || 0}
                    onChange={e => setEditForm(prev => ({ ...prev, coins: parseInt(e.target.value) }))}
                    className="w-24 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Coins"
                  />
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editForm.is_super_admin || false}
                      onChange={e => setEditForm(prev => ({ ...prev, is_super_admin: e.target.checked }))}
                      className="form-checkbox h-5 w-5 text-indigo-600"
                    />
                    <span>Admin</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setEditForm({});
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    icon={<Save size={20} />}
                    disabled={loading}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold dark:text-white">{user.name}</h3>
                    {user.is_super_admin && (
                      <Shield size={16} className="text-indigo-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <Star size={16} className="text-yellow-500" />
                      <span className="text-sm">Level {user.level}</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {user.xp.toLocaleString()} XP
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {user.coins.toLocaleString()} Coins
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleEdit(user)}
                    icon={<Edit size={20} />}
                    disabled={loading}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(user.id)}
                    icon={<Trash2 size={20} />}
                    disabled={loading}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
