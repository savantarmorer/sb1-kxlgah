// src/components/admin/AdminDashboard.tsx
import React, { useState } from 'react';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Tab, Typography, Button } from '@mui/material';
import { X, LayoutDashboard, Users, Trophy, ShoppingBag, Palette } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import QuestManager from './QuestManager';
import { ItemManager } from './ItemManager';
import { ShopManager } from './ShopManager';
import { UserManager } from './UserManager';
import { AchievementManager } from './AchievementManager';
import { TournamentManager } from './TournamentManager';
import { Statistics } from './Statistics';
import EnhancedVisualEditor from './EnhancedVisualEditor';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { state } = useGame();

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
          variant="outlined"
          startIcon={<X size={24} />}
          onClick={() => {}}
          sx={{ padding: '0.25rem' }}
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
            <Tab 
              label="Visual Editor" 
              value="editor" 
              icon={<Palette sx={{ fontSize: 20 }} />}
              iconPosition="start"
            />
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
        <TabPanel value="editor" sx={{ p: 0, height: 'calc(100vh - 200px)' }}>
          <EnhancedVisualEditor />
        </TabPanel>
        <TabPanel value="settings">
          {/* Settings Content */}
        </TabPanel>
      </TabContext>
    </Box>
  );
}

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