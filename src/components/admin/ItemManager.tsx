import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Edit, Trash2, Save } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { GameItem } from '../../types/items';
import { supabase } from '../../lib/supabase';
import Button from '../Button';

interface ItemManagerProps {
  onSave: (data: any, type: string) => Promise<void>;
  onDelete: (id: string, type: string) => Promise<void>;
  loading: boolean;
}

export default function ItemManager({ onSave, onDelete, loading }: ItemManagerProps) {
  const { state, dispatch } = useGame();
  const [items, setItems] = useState<GameItem[]>(state.items);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<GameItem>>({});

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setItems(data);
        dispatch({ type: 'SYNC_ITEMS', payload: data });
      }
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const handleEdit = (item: GameItem) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const handleSave = async () => {
    if (!editForm.id) return;
    
    try {
      await onSave(editForm, 'items');
      await loadItems();
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id, 'items');
      await loadItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleAdd = () => {
    const newItem: Partial<GameItem> = {
      id: `item_${Date.now()}`,
      name: 'New Item',
      description: 'Item description',
      type: 'consumable',
      rarity: 'common',
      cost: 100,
      effects: []
    };

    setEditForm(newItem);
    setEditingId(newItem.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white">Item Manager</h2>
        <Button
          variant="primary"
          onClick={handleAdd}
          icon={<Plus size={20} />}
          disabled={loading}
        >
          Add Item
        </Button>
      </div>

      <div className="space-y-4">
        {items.map(item => (
          <motion.div
            key={item.id}
            layout
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
          >
            {editingId === item.id ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Item Name"
                />
                <textarea
                  value={editForm.description || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Item Description"
                />
                <div className="flex space-x-4">
                  <select
                    value={editForm.type || 'consumable'}
                    onChange={e => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                    className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="consumable">Consumable</option>
                    <option value="equipment">Equipment</option>
                    <option value="cosmetic">Cosmetic</option>
                  </select>
                  <select
                    value={editForm.rarity || 'common'}
                    onChange={e => setEditForm(prev => ({ ...prev, rarity: e.target.value }))}
                    className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="common">Common</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                  </select>
                  <input
                    type="number"
                    value={editForm.cost || 0}
                    onChange={e => setEditForm(prev => ({ ...prev, cost: parseInt(e.target.value) }))}
                    className="w-24 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Cost"
                  />
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
                  <h3 className="font-semibold dark:text-white">{item.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Package size={16} className="text-indigo-500" />
                    <span className="text-sm">{item.cost} coins</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      item.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                      item.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                      item.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.rarity}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleEdit(item)}
                    icon={<Edit size={20} />}
                    disabled={loading}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(item.id)}
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
