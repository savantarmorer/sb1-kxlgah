import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Play, RotateCcw, Save, Crown } from 'lucide-react';
import Button from '../Button';
import { TitleService } from '../../services/titleService';
import type { DisplayTitle } from '../../types/titles';
import { supabase } from '../../lib/supabase';

interface AdminPanelProps {
  on_close: () => void;
  rewards: Array<{
    day: number;
    reward: {
      type: string;
      value: number;
      rarity: string;
    };
  }>;
  on_update_rewards: (rewards: any[]) => void;
}

export default function AdminPanel({
  on_close,
  rewards,
  on_update_rewards
}: AdminPanelProps) {
  const [editingRewards, setEditingRewards] = useState(rewards);
  const [previewMode, setPreviewMode] = useState<string | null>(null);
  const [titles, setTitles] = useState<DisplayTitle[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<DisplayTitle | null>(null);
  const [isAddingTitle, setIsAddingTitle] = useState(false);

  useEffect(() => {
    loadTitles();
  }, []);

  const loadTitles = async () => {
    try {
      const data = await TitleService.getAllTitles();
      setTitles(data);
    } catch (error) {
      console.error('Error loading titles:', error);
    }
  };

  const handleRewardUpdate = (index: number, field: string, value: any) => {
    const updated = [...editingRewards];
    updated[index] = {
      ...updated[index],
      reward: {
        ...updated[index].reward,
        [field]: value
      }
    };
    setEditingRewards(updated);
  };

  const handleSave = () => {
    on_update_rewards(editingRewards);
    on_close();
  };

  const handlePreview = (mode: string) => {
    setPreviewMode(mode);
    setTimeout(() => setPreviewMode(null), 3000);
  };

  const handleResetStreak = () => {
    console.log('Streak reset');
  };

  const handleCreateTitle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const titleData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseInt(formData.get('price') as string, 10),
      rarity: formData.get('rarity') as DisplayTitle['rarity'],
      is_active: true,
      requirements: {
        level: parseInt(formData.get('required_level') as string, 10) || 0
      },
      metadata: {
        color: formData.get('color') as string
      }
    };

    try {
      // Create the title
      const title = await TitleService.createTitle(titleData);

      // Add it to the shop
      await supabase.from('shop_items').insert({
        item_id: title.id,
        price: titleData.price,
        is_available: true,
        is_featured: formData.get('is_featured') === 'true'
      });

      setIsAddingTitle(false);
      loadTitles();
    } catch (error) {
      console.error('Error creating title:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold dark:text-white">
            Admin Panel
          </h2>
          <button
            onClick={on_close}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Title Management Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold dark:text-white flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Title Management
            </h3>
            <Button
              variant="primary"
              onClick={() => setIsAddingTitle(true)}
            >
              Add New Title
            </Button>
          </div>

          {isAddingTitle && (
            <form onSubmit={handleCreateTitle} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="name"
                  placeholder="Title Name"
                  className="input"
                  required
                />
                <input
                  name="description"
                  placeholder="Description"
                  className="input"
                />
                <input
                  name="price"
                  type="number"
                  placeholder="Price (coins)"
                  className="input"
                  required
                />
                <select name="rarity" className="input" required>
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>
                <input
                  name="required_level"
                  type="number"
                  placeholder="Required Level"
                  className="input"
                />
                <input
                  name="color"
                  placeholder="Color (hex)"
                  className="input"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_featured"
                    id="is_featured"
                    className="checkbox"
                  />
                  <label htmlFor="is_featured">Featured in Shop</label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="primary">Create</Button>
                  <Button
                    variant="secondary"
                    onClick={() => setIsAddingTitle(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {titles.map((title) => (
              <div
                key={title.id}
                className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{title.name}</h4>
                    <p className="text-sm text-gray-500">{title.description}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">Price: {title.price} coins</p>
                      <p className="text-sm">Rarity: {title.rarity}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedTitle(title);
                        // Add edit logic
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={async () => {
                        if (window.confirm('Delete this title?')) {
                          await TitleService.deleteTitle(title.id);
                          loadTitles();
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Original Rewards Section */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="font-semibold dark:text-white">Preview Effects</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Play size={16} />}
                  onClick={() => handlePreview('common')}
                >
                  Common Reward
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Play size={16} />}
                  onClick={() => handlePreview('legendary')}
                >
                  Legendary Reward
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold dark:text-white">Streak Controls</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<RotateCcw size={16} />}
                  onClick={handleResetStreak}
                >
                  Reset Streak
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 dark:text-white">Reward Values</h3>
            <div className="space-y-4">
              {editingRewards.map((reward, index) => (
                <div
                  key={reward.day}
                  className="grid grid-cols-4 gap-4 items-center"
                >
                  <div className="text-sm font-medium dark:text-white">
                    Day {reward.day}
                  </div>
                  <select
                    value={reward.reward.type}
                    onChange={(e) =>
                      handleRewardUpdate(index, 'type', e.target.value)
                    }
                    className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  >
                    <option value="xp">XP</option>
                    <option value="coins">Coins</option>
                    <option value="item">Item</option>
                    <option value="title">Title</option>
                  </select>
                  <input
                    type="number"
                    value={reward.reward.value}
                    onChange={(e) =>
                      handleRewardUpdate(index, 'value', parseInt(e.target.value))
                    }
                    className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <select
                    value={reward.reward.rarity}
                    onChange={(e) =>
                      handleRewardUpdate(index, 'rarity', e.target.value)
                    }
                    className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  >
                    <option value="common">Common</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={on_close}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<Save size={16} />}
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}