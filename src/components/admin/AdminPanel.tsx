import React from 'react';
import { Box, Tabs, Tab, Button } from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { GameState } from '../../types/game';
import { Quest } from '../../types/quests';
import { QuestAdminDashboard } from './QuestAdminDashboard';
import { UserManager } from './UserManager';
import { TournamentManager } from './TournamentManager';
import { ItemManager } from './ItemManager';
import { AchievementManager } from './AchievementManager';
import { Statistics } from './Statistics';
import { ShopAdminDashboard } from './ShopAdminDashboard';
import { LayoutDashboard, ShoppingBag } from 'lucide-react';
import AdminDashboard from './AdminDashboard';

interface AdminPanelProps {
  state: GameState;
  quests: Quest[];
  on_UPDATE_QUESTs: (quests: Quest[]) => void;
  on_close: () => void;
}

const ADMIN_SECTIONS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard />,
    component: AdminDashboard,
  },
  {
    id: 'shop',
    label: 'Shop',
    icon: <ShoppingBag />,
    component: ShopAdminDashboard,
  },
  // ... other sections ...
];

const AdminPanel: React.FC<AdminPanelProps> = ({ state, quests, on_UPDATE_QUESTs, on_close }) => {
  const [value, setValue] = React.useState('0');

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Box 
      sx={{ 
        width: '95%',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem',
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: 3
      }}
    >
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <TabList onChange={handleChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Quests" value="0" />
            <Tab label="Users" value="1" />
            <Tab label="Tournaments" value="2" />
            <Tab label="Items" value="3" />
            <Tab label="Achievements" value="4" />
            <Tab label="Statistics" value="5" />
            <Tab label="Shop" value="6" />
          </TabList>
        </Box>
        <TabPanel value="0" sx={{ p: 0 }}>
          <QuestAdminDashboard 
            quests={quests}
            onUpdateQuests={on_UPDATE_QUESTs}
          />
        </TabPanel>
        <TabPanel value="1" sx={{ p: 0 }}>
          <UserManager state={state} />
        </TabPanel>
        <TabPanel value="2" sx={{ p: 0 }}>
          <TournamentManager />
        </TabPanel>
        <TabPanel value="3" sx={{ p: 0 }}>
          <ItemManager />
        </TabPanel>
        <TabPanel value="4" sx={{ p: 0 }}>
          <AchievementManager />
        </TabPanel>
        <TabPanel value="5" sx={{ p: 0 }}>
          <Statistics />
        </TabPanel>
        <TabPanel value="6" sx={{ p: 0 }}>
          <ShopAdminDashboard />
        </TabPanel>
      </TabContext>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={on_close}>Close</Button>
      </Box>
    </Box>
  );
};

export default AdminPanel;