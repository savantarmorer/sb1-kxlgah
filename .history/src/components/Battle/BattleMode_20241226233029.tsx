import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useBattle } from '../../hooks/useBattle';
import { PreBattleLobby } from './PreBattleLobby';
import { GameEngine } from '../../game-engine';
import { getAICardSelection } from '../../utils/cardUtils';
import { BattleStateEnum } from '../../types/battle';

interface BattleModeProps {
  onClose: () => void;
}

export const BattleMode: React.FC<BattleModeProps> = ({ onClose }) => {
  const { state, dispatch } = useBattle();
  const [showPreBattleLobby, setShowPreBattleLobby] = useState(true);

  useEffect(() => {
    if (state.phase === BattleStateEnum.COMPLETED) {
      onClose();
    }
  }, [state.phase, onClose]);

  const handleGameOver = (winnerId: string) => {
    dispatch({ type: 'SET_WINNER', payload: { winner: winnerId } });
  };

  if (showPreBattleLobby) {
    return (
      <PreBattleLobby
        onReady={() => setShowPreBattleLobby(false)}
        onClose={onClose}
      />
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: 'background.paper',
        position: 'relative'
      }}
    >
      <GameEngine
        playerName="Player"
        opponentName="AI"
        playerDeck={state.player_deck}
        opponentDeck={state.opponent_deck}
        onGameOver={handleGameOver}
      />
    </Box>
  );
};