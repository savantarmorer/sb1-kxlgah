<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Search, Filter, ArrowUpDown } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { useAdmin } from '../../hooks/useAdmin';
import { GameItem, ItemType, ItemRarity } from '../../types/items';
import Button from '../Button';
import ItemEditor from './ItemEditor';
import { useAdminActions } from '../../hooks/useAdminActions';

/**
 * Available item types for filtering
 */
const ITEM_TYPES: ItemType[] = [
  'material',
  'booster',
  'cosmetic',
  'consumable',
  'equipment'
];

/**
 * Filter interface for item filtering
 */
interface ItemFilters {
  search: string;
  type: ItemType | 'all';
  rarity: ItemRarity | 'all';
}

/**
 * Sort configuration interface
 */
interface ItemSort {
  field: 'name' | 'cost' | 'type' | 'rarity' | 'createdAt';
  direction: 'asc' | 'desc';
}

export default function ItemManager() {
  const { state } = useGame();
  const { isAdmin } = useAdmin();
  const { saveItem } = useAdminActions();
  const [isLoading, setIsLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Partial<GameItem> | undefined>(undefined);
  const [filters, setFilters] = useState<ItemFilters>({
    search: '',
    type: 'all',
    rarity: 'all'
  });
  const [sort, setSort] = useState<ItemSort>({
    field: 'createdAt',
    direction: 'desc'
  });

  // Sync items with state
  useEffect(() => {
    const loadItems = async () => {
      try {
        setIsLoading(true);
        // Any additional item loading logic can go here
      } catch (error) {
        console.error('Error loading items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, []);

  /**
   * Updates sort configuration
   */
  const handleSort = (field: ItemSort['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  /**
   * Updates filter settings
   */
  const handleFilterChange = (updates: Partial<ItemFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  /**
   * Handles saving or updating an item
   * @param item - The item to save
   */
  const handleSaveItem = async (item: Partial<GameItem>) => {
    try {
      setIsLoading(true);
      await saveItem(item);
      setShowEditor(false);
    } catch (error) {
      console.error('Error saving item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles item editing
   * @param item - The item to edit
   */
  const handleEditItem = (item: GameItem) => {
    setSelectedItem(item);
    setShowEditor(true);
  };

  /**
   * Handles item deletion (soft delete)
   * Uses saveItem with is_active: false instead of a separate delete function
   * @param itemId - ID of the item to delete
   */
  const handleSoftDelete = async (itemId: string) => {
    try {
      setIsLoading(true);
      await saveItem({ 
        id: itemId, 
        is_active: false 
      });
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Filters and sorts items based on current filters and sort settings
   */
  const getFilteredItems = (items: GameItem[]) => {
    return items
      .filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                            item.description.toLowerCase().includes(filters.search.toLowerCase());
        const matchesType = filters.type === 'all' || item.type === filters.type;
        const matchesRarity = filters.rarity === 'all' || item.rarity === filters.rarity;
        return matchesSearch && matchesType && matchesRarity;
      })
      .sort((a, b) => {
        const direction = sort.direction === 'asc' ? 1 : -1;
        switch (sort.field) {
          case 'name':
            return direction * a.name.localeCompare(b.name);
          case 'cost':
            return direction * (a.cost - b.cost);
          case 'type':
            return direction * a.type.localeCompare(b.type);
          case 'rarity':
            return direction * a.rarity.localeCompare(b.rarity);
          default:
            return direction * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        }
      });
  };

  // Get filtered items based on current filters and sort settings
  const filteredItems = getFilteredItems(state.items || []);

  // Only render for admin users
  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Package className="text-gray-400" size={24} />
          <h2 className="text-2xl font-bold dark:text-white">Item Management</h2>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowEditor(true)}
          icon={<Plus size={16} />}
          disabled={isLoading}
        >
          Add Item
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search items..."
            value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange({ type: e.target.value as ItemType | 'all' })}
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="all">All Types</option>
            {ITEM_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Sort Control */}
        <div className="flex items-center space-x-2">
          <select
            value={sort.field}
            onChange={(e) => handleSort(e.target.value as ItemSort['field'])}
            className="rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="createdAt">Date Created</option>
            <option value="name">Name</option>
            <option value="cost">Cost</option>
            <option value="type">Type</option>
            <option value="rarity">Rarity</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSort(prev => ({
              ...prev,
              direction: prev.direction === 'asc' ? 'desc' : 'asc'
            }))}
            icon={<ArrowUpDown size={16} />}
          />
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
                      {item.type}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      item.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                      item.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {item.rarity}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditItem(item)}
                    disabled={isLoading}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSoftDelete(item.id)}
                    disabled={isLoading}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Item Editor Modal */}
      {showEditor && (
        <ItemEditor
          item={selectedItem}
          onSave={handleSaveItem}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}

/**
 * Component Dependencies:
 * - useGame: For accessing global game state
 * - useAdmin: For admin permission checks
 * - useAdminActions: For CRUD operations
 * - ItemEditor: For editing item details
 * 
 * State Management:
 * - Local state for UI (filters, sort, loading)
 * - Global state through GameContext
 * 
 * Database Interactions:
 * - Creates/updates items through useAdminActions
 * - Syncs with GameContext state
 * 
 * Used By:
 * - AdminDashboard component
 * 
 * Features:
 * - Item CRUD operations
 * - Search and filtering
 * - Sorting
 * - Responsive grid layout
 * - Animated transitions
 */
=======
import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { Plus, Trash2, Save } from 'lucide-react';
import { InventoryItem } from '../../types';

export default function ItemManager() {
  const { state } = useGame();
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('items');
    return saved ? JSON.parse(saved) : [];
  });
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    type: 'material',
    rarity: 'common'
  });

  const addItem = () => {
    if (!newItem.name || !newItem.description) return;

    const item: InventoryItem = {
      id: `item_${Date.now()}`,
      name: newItem.name,
      description: newItem.description,
      type: newItem.type || 'material',
      rarity: newItem.rarity || 'common',
      uses: newItem.uses
    };

    setItems([...items, item]);
    setNewItem({
      type: 'material',
      rarity: 'common'
    });
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const saveItems = () => {
    localStorage.setItem('items', JSON.stringify(items));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Add New Item</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Item Name"
            value={newItem.name || ''}
            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
            className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <select
            value={newItem.type || 'material'}
            onChange={e => setNewItem({ ...newItem, type: e.target.value as InventoryItem['type'] })}
            className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="material">Material</option>
            <option value="booster">Booster</option>
            <option value="cosmetic">Cosmetic</option>
          </select>
          <div className="md:col-span-2">
            <textarea
              placeholder="Item Description"
              value={newItem.description || ''}
              onChange={e => setNewItem({ ...newItem, description: e.target.value })}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              rows={3}
            />
          </div>
          <select
            value={newItem.rarity || 'common'}
            onChange={e => setNewItem({ ...newItem, rarity: e.target.value as InventoryItem['rarity'] })}
            className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="common">Common</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
            <option value="legendary">Legendary</option>
          </select>
          <input
            type="number"
            placeholder="Uses (optional)"
            value={newItem.uses || ''}
            onChange={e => setNewItem({ ...newItem, uses: parseInt(e.target.value) })}
            className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <button
            onClick={addItem}
            className="md:col-span-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold dark:text-white">Item List</h3>
          <button
            onClick={saveItems}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Save size={20} />
            <span>Save Changes</span>
          </button>
        </div>
        <div className="space-y-4">
          {items.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium dark:text-white">{item.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.rarity === 'legendary'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                        : item.rarity === 'epic'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                        : item.rarity === 'rare'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                    }`}>
                      {item.rarity}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">{item.type}</span>
                    {item.uses && (
                      <span className="text-gray-600 dark:text-gray-300">
                        {item.uses} uses
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
>>>>>>> 161a49f523d659b828aff32646c54b4d64a35f0d
