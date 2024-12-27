import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useBattle } from '../../hooks/useBattle';
import { PreBattleLobby } from './PreBattleLobby';
import { GameEngine } from '../../game-engine';
import { BattleStateEnum } from '../../types/battle';
import { createDeck } from '../../utils/cardUtils';

interface BattleModeProps {
  onClose: () => void;
}

export const BattleMode: React.FC<BattleModeProps> = ({ onClose }) => {
  const { state, dispatch } = useBattle();
  const [showPreBattleLobby, setShowPreBattleLobby] = useState(true);

  useEffect(() => {
    if (state?.phase === BattleStateEnum.COMPLETED) {
      onClose();
    }
  }, [state?.phase, onClose]);

  const handleGameOver = (winnerId: string) => {
    dispatch({ 
      type: 'SET_BATTLE_STATUS', 
      payload: BattleStateEnum.COMPLETED 
    });
  };

  const handleBattleStart = () => {
    const playerDeck = createDeck('promotoria');
    const opponentDeck = createDeck('defesa');

    dispatch({
      type: 'PLAY_CARD',
      payload: {
        playerCard: playerDeck[0],
        opponentCard: opponentDeck[0],
        score: { player: 0, opponent: 0 }
      }
    });

    setShowPreBattleLobby(false);
  };

  if (showPreBattleLobby) {
    return (
      <PreBattleLobby
        onBattleStart={handleBattleStart}
        onCancel={onClose}
      />
    );
  }

  if (!state) return null;

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
        playerDeck={state.playerDeck || []}
        opponentDeck={state.opponentDeck || []}
        onGameOver={handleGameOver}
      />
    </Box>
  );
};