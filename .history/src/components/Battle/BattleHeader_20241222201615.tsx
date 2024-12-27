import { Box, Avatar, Typography, LinearProgress } from '@mui/material';
import { PlayerState } from '../../types/battle';
import { User } from '../../types/user';

interface BattleHeaderProps {
  playerState: PlayerState;
  opponentState: PlayerState;
  user: User | null;
  botAvatar: string;
  timeLeft: number;
}

export default function BattleHeader({ playerState, opponentState, user, botAvatar, timeLeft }: BattleHeaderProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
      {/* Player info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar src={user?.avatar_url} sx={{ width: 64, height: 64, border: '2px solid', borderColor: 'primary.main' }} />
        <Box>
          <Typography variant="h6">{user?.name || 'Player'}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={(playerState.health / 50) * 100} 
              sx={{ 
                width: 150, 
                height: 10, 
                borderRadius: 5,
                backgroundColor: 'rgba(255,255,255,0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'primary.main'
                }
              }} 
            />
            <Typography variant="body2">{playerState.health}/50</Typography>
          </Box>
          {playerState.shield > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <LinearProgress 
                variant="determinate" 
                value={(playerState.shield / 50) * 100} 
                sx={{ 
                  width: 150, 
                  height: 6, 
                  borderRadius: 5,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'info.main'
                  }
                }} 
              />
              <Typography variant="body2" color="info.main">{playerState.shield}</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Timer */}
      <Box sx={{ 
        width: 80, 
        height: 80, 
        borderRadius: '50%', 
        border: '4px solid', 
        borderColor: timeLeft < 10 ? 'error.main' : 'primary.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h4">{timeLeft}</Typography>
      </Box>

      {/* Opponent info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: 'row-reverse' }}>
        <Avatar src={botAvatar} sx={{ width: 64, height: 64, border: '2px solid', borderColor: 'error.main' }} />
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h6">Bot Opponent</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: 'row-reverse' }}>
            <LinearProgress 
              variant="determinate" 
              value={(opponentState.health / 50) * 100} 
              sx={{ 
                width: 150, 
                height: 10, 
                borderRadius: 5,
                backgroundColor: 'rgba(255,255,255,0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'error.main'
                }
              }} 
            />
            <Typography variant="body2">{opponentState.health}/50</Typography>
          </Box>
          {opponentState.shield > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexDirection: 'row-reverse' }}>
              <LinearProgress 
                variant="determinate" 
                value={(opponentState.shield / 50) * 100} 
                sx={{ 
                  width: 150, 
                  height: 6, 
                  borderRadius: 5,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'info.main'
                  }
                }} 
              />
              <Typography variant="body2" color="info.main">{opponentState.shield}</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
} 