import React from 'react';
import { Box, Typography, IconButton, useTheme } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BattleHeaderProps {
  title?: string;
  subtitle?: string;
}

export function BattleHeader({ title = 'Battle Mode', subtitle = 'Test your knowledge in real-time battles' }: BattleHeaderProps) {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box sx={{ 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      mb: 4
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton 
          onClick={() => navigate(-1)}
          sx={{ 
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': { bgcolor: 'background.paper' }
          }}
        >
          <ArrowLeft />
        </IconButton>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
} 