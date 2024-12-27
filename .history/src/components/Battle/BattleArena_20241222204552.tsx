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
        {/* Player Health/Shield */}
        <Box sx={{ width: '100%', maxWidth: 200 }}>
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              HP: {playerState.health}/50
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(playerState.health / 50) * 100}
              sx={{
                height: 8,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'primary.main'
                }
              }}
            />
          </Box>
          {playerState.shield > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Shield: {playerState.shield}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(playerState.shield / 30) * 100}
                sx={{
                  height: 6,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'info.main'
                  }
                }}
              />
            </Box>
          )}
        </Box>
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
        {/* Opponent Health/Shield */}
        <Box sx={{ width: '100%', maxWidth: 200 }}>
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              HP: {opponentState.health}/50
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(opponentState.health / 50) * 100}
              sx={{
                height: 8,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.error.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'error.main'
                }
              }}
            />
          </Box>
          {opponentState.shield > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Shield: {opponentState.shield}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(opponentState.shield / 30) * 100}
                sx={{
                  height: 6,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'info.main'
                  }
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
} 