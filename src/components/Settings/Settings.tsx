import React, { useState } from 'react';
import { useColorMode } from '../../contexts/ColorModeContext';
import { useSound } from '../../hooks/useSound';
import { use_language } from '../../contexts/LanguageContext';
import { EditProfileMenu } from '../Profile/EditProfileMenu';
import { User, Moon, Sun, Volume2, Languages } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageContainer } from '../Layout/PageContainer';
import { Box, Typography, Select, MenuItem, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function Settings() {
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();
  const { volume, setVolume, isMuted, toggleMute } = useSound();
  const { language, setLanguage } = use_language();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  return (
    <PageContainer>
      <Box sx={{ maxWidth: '4xl', mx: 'auto', p: 6, '& > *': { mb: 4 } }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
            Settings
          </Typography>
        </motion.div>
        
        <Box sx={{ display: 'grid', gap: 4 }}>
          {/* Theme Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Box sx={{ 
              p: 3, 
              borderRadius: 2,
              bgcolor: 'background.paper',
              boxShadow: 1,
              border: 1,
              borderColor: 'divider'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <IconButton color="primary">
                  {mode === 'dark' ? <Moon /> : <Sun />}
                </IconButton>
                <Typography variant="h6">Theme</Typography>
              </Box>
              <Select
                fullWidth
                value={mode}
                onChange={(e) => {
                  if (e.target.value === 'dark' && mode === 'light') toggleColorMode();
                  if (e.target.value === 'light' && mode === 'dark') toggleColorMode();
                }}
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
              </Select>
            </Box>
          </motion.div>

          {/* Sound Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Box sx={{ 
              p: 3, 
              borderRadius: 2,
              bgcolor: 'background.paper',
              boxShadow: 1,
              border: 1,
              borderColor: 'divider'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <IconButton color="primary">
                  <Volume2 />
                </IconButton>
                <Typography variant="h6">Sound</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleMute}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: isMuted ? theme.palette.action.hover : theme.palette.primary.main,
                    color: isMuted ? theme.palette.text.primary : theme.palette.primary.contrastText,
                  }}
                >
                  {isMuted ? 'Unmute' : 'Mute'}
                </motion.button>
                <Box sx={{ flex: 1 }}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </Box>
              </Box>
            </Box>
          </motion.div>

          {/* Language Section */}
          <Box sx={{ 
            p: 3, 
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: 1,
            border: 1,
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <IconButton color="primary">
                <Languages />
              </IconButton>
              <Typography variant="h6">Language</Typography>
            </Box>
            <Select
              fullWidth
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="pt">Português</MenuItem>
              <MenuItem value="es">Español</MenuItem>
            </Select>
          </Box>

          {/* Profile Section */}
          <Box sx={{ 
            p: 3, 
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: 1,
            border: 1,
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton color="primary">
                  <User />
                </IconButton>
                <Typography variant="h6">Profile</Typography>
              </Box>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditProfileOpen(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <User size={16} />
                Edit Profile
              </motion.button>
            </Box>
          </Box>
        </Box>

        <EditProfileMenu 
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
        />
      </Box>
    </PageContainer>
  );
} 