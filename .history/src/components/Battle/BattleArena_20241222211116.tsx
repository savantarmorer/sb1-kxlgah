import React from 'react';
import { Box, Typography, Avatar, LinearProgress, useTheme, alpha } from '@mui/material';
import { PlayerState } from '../../types/battle';
import { User } from '../../types/user';

interface BattleArenaProps {
  playerState: PlayerState;
  opponentState: PlayerState;
  currentUser: User | null;
  botAvatar: string;
}

export function BattleArena({ playerState, opponentState, currentUser, botAvatar }: BattleArenaProps) {
  const theme = useTheme();

  const HealthBar = ({ health, shield, isOpponent = false }: { health: number; shield: number; isOpponent?: boolean }) => (
    <Box sx={{ width: '100%', maxWidth: 200 }}>
      {/* Health Bar */}
      <Box sx={{ mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          HP: {health}/50
        </Typography>
        <LinearProgress
          variant="determinate"
          value={(health / 50) * 100}
          sx={{
            height: 10,
            borderRadius: 1,
            bgcolor: alpha(isOpponent ? theme.palette.error.main : theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': {
              bgcolor: isOpponent ? 'error.main' : 'primary.main'
            }
          }}
        />
      </Box>
      {/* Shield Bar */}
      <Box sx={{ mt: -0.5 }}>
        <LinearProgress
          variant="determinate"
          value={(shield / 30) * 100}
          sx={{
            height: 4,
            borderRadius: '0 0 4px 4px',
            bgcolor: alpha(theme.palette.grey[500], 0.1),
            '& .MuiLinearProgress-bar': {
              bgcolor: 'grey.500'
            }
          }}
        />
        {shield > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Shield: {shield}
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      mb: 4
    }}>
      {/* Player Info */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}>
        <Avatar
          src={currentUser?.avatar_url}
          sx={{ 
            width: 80,
            height: 80,
            border: '4px solid',
            borderColor: 'primary.main'
          }}
        />
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {currentUser?.name}
        </Typography>
        <HealthBar health={playerState.health} shield={playerState.shield} />
      </Box>

      {/* VS Divider */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        mx: 4
      }}>
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          border: '2px solid',
          borderColor: alpha(theme.palette.primary.main, 0.2)
        }}>
          <Typography variant="h6" color="text.secondary">
            VS
          </Typography>
        </Box>
      </Box>

      {/* Opponent Info */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}>
        <Avatar
          src={botAvatar}
          sx={{ 
            width: 80,
            height: 80,
            border: '4px solid',
            borderColor: 'error.main'
          }}
        />
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Bot Opponent
        </Typography>
        <HealthBar health={opponentState.health} shield={opponentState.shield} isOpponent />
      </Box>
    </Box>
  );
} 