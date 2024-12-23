// src/components/admin/AdminDashboard.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, 
  Package, 
  ScrollText, 
  Store, 
  Users, 
  X,
  BarChart2,
  ShoppingBag,
  Shield,
  Settings,
  Trophy,
  Crown
} from 'lucide-react';
import QuestManager from './QuestManager';
import { ItemManager } from './ItemManager';
import { ShopManager } from './ShopManager';
import { UserManager } from './UserManager';
import { Statistics } from './Statistics';
import Button from '../Button';
import { StatisticsService } from '../../services/statisticsService';
import { useGame } from '../../contexts/GameContext';
import type { GameStatistics } from '../../types/game';
import { TournamentManager } from './TournamentManager';
import { 
  Tabs, 
  Tab, 
  Box,
  Typography 
} from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { AchievementManager } from './AchievementManager';
import TitleManager from './TitleManager';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { state } = useGame();
  const [showTitleManager, setShowTitleManager] = useState(false);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ padding: '1rem' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem' 
      }}>
        <Typography variant="h4">Admin Dashboard</Typography>
        <Button
          variant="outline"
          icon={<X size={24} />}
          onClick={() => {}}
          className="!p-1"
        />
      </Box>

      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange}>
            <Tab label="Overview" value="overview" />
            <Tab label="Quests" value="quests" />
            <Tab label="Items" value="items" />
            <Tab label="Shop" value="shop" />
            <Tab label="Users" value="users" />
            <Tab label="Achievements" value="achievements" />
            <Tab label="Tournaments" value="tournaments" />
            <Tab label="Settings" value="settings" />
          </TabList>
        </Box>

        <TabPanel value="overview">
          <Statistics />
        </TabPanel>
        <TabPanel value="quests">
          <QuestManager />
        </TabPanel>
        <TabPanel value="items">
          <ItemManager />
        </TabPanel>
        <TabPanel value="shop">
          <ShopManager />
        </TabPanel>
        <TabPanel value="users">
          <UserManager state={state} />
        </TabPanel>
        <TabPanel value="achievements">
          <AchievementManager />
        </TabPanel>
        <TabPanel value="tournaments">
          <TournamentManager />
        </TabPanel>
        <TabPanel value="settings">
          {/* Settings Content */}
        </TabPanel>
      </TabContext>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          onClick={() => setShowTitleManager(true)}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-6 h-6 text-purple-500" />
            <h3 className="text-lg font-semibold">Title Management</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage display titles, their rarities, and prices
          </p>
        </button>
      </div>

      {showTitleManager && (
        <TitleManager onClose={() => setShowTitleManager(false)} />
      )}
    </Box>
  );
};

export default AdminDashboard;

/**
 * Component Role:
 * - Admin interface for managing game content
 * - Statistics overview
 * - User management
 * - Content management
 * 
 * Dependencies:
 * - GameContext for state
 * - StatisticsService for data
 * - Management components
 * 
 * Features:
 * - Tab navigation
 * - Statistics loading
 * - Error handling
 * - Loading states
 * 
 * Scalability:
 * - Easy to add new tabs
 * - Modular components
 * - Error boundary ready
 * - Performance optimized
 */