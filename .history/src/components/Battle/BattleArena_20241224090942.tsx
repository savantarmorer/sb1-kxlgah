import React from 'react';
import { Box, Typography, Avatar, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import { PlayerState } from '../../types/battle';
import { BattleCard } from './BattleCard';
import { User } from '../../types/user';

interface BattleArenaProps {
  playerState: PlayerState;
  currentUser?: User | null;
  botAvatar?: string;
  isOpponent?: boolean;
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  playerState,
  currentUser,
  botAvatar,
  isOpponent = false
}) => {
  const theme = useTheme();

  const renderHealthBar = (current: number, max: number = 50, isPlayer: boolean = true) => (
    <Box sx={{ width: '100%', mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          HP
        </Typography>
        <Typography variant="subtitle2">
          {current}/{max}
        </Typography>
      </Box>
      <Box
        sx={{
          width: '100%',
          height: 12,
          bgcolor: alpha(theme.palette.error.main, 0.1),
          borderRadius: 1,
          overflow: 'hidden'
        }}
      >
        <motion.div
          initial={{ width: `${(current / max) * 100}%` }}
          animate={{ width: `${(current / max) * 100}%` }}
          transition={{ duration: 0.5 }}
          style={{
            height: '100%',
            backgroundColor: theme.palette.error.main,
            borderRadius: 'inherit'
          }}
        />
      </Box>
    </Box>
  );

  const renderShieldBar = (shield: number, max: number = 50) => (
    <Box sx={{ width: '100%', mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          Shield
        </Typography>
        <Typography variant="subtitle2">
          {shield}/{max}
        </Typography>
      </Box>
      <Box
        sx={{
          width: '100%',
          height: 8,
          bgcolor: alpha(theme.palette.info.main, 0.1),
          borderRadius: 1,
          overflow: 'hidden'
        }}
      >
        <motion.div
          initial={{ width: `${(shield / max) * 100}%` }}
          animate={{ width: `${(shield / max) * 100}%` }}
          transition={{ duration: 0.5 }}
          style={{
            height: '100%',
            backgroundColor: theme.palette.info.main,
            borderRadius: 'inherit'
          }}
        />
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 4,
        p: 4
      }}
    >
      {/* Player Side */}
      <Box sx={{ flex: 1, textAlign: 'center' }}>
        <Avatar
          src={currentUser?.avatar_url}
          alt={currentUser?.username}
          sx={{ width: 80, height: 80, mb: 2, mx: 'auto' }}
        />
        <Typography variant="h6" sx={{ mb: 2 }}>
          {currentUser?.username || 'Player'}
        </Typography>
        {renderHealthBar(playerState.health)}
        {renderShieldBar(playerState.shield)}
        {playerState.hand.selectedCard && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Selected Card
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <BattleCard
                card={playerState.hand.selectedCard}
                isSelected={true}
                isPlayable={false}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Center Area */}
      <Box
        sx={{
          flex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            color: theme.palette.text.secondary,
            textTransform: 'uppercase'
          }}
        >
          VS
        </Typography>
      </Box>

      {/* Opponent Side */}
      <Box sx={{ flex: 1, textAlign: 'center' }}>
        <Avatar
          src={botAvatar}
          alt="Opponent"
          sx={{ width: 80, height: 80, mb: 2, mx: 'auto' }}
        />
        <Typography variant="h6" sx={{ mb: 2 }}>
          Opponent
        </Typography>
        {renderHealthBar(playerState.health, 50, false)}
        {renderShieldBar(playerState.shield)}
        {playerState.hand.selectedCard && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Selected Card
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <BattleCard
                card={playerState.hand.selectedCard}
                showBack={!playerState.isReady}
                isPlayable={false}
              />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}; 