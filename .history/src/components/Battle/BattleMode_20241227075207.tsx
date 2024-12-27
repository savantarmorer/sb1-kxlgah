import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useGame } from '../../contexts/GameContext';
import { BattleStateEnum } from '../../types/battle';
import { useBattle } from '../../hooks/useBattle';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { CardDistribution } from './CardDistribution';
import { BattleHand } from './BattleHand';
import { createDeck } from '../../utils/cardUtils';
import type { Card } from '../../utils/cardUtils';

interface BattleModeProps {
  on_close?: () => void;
}

export default function BattleMode({ on_close }: BattleModeProps) {
  const { state: gameState } = useGame();
  const { 
    initializeBattle,
    phase,
  } = useBattle();
  const { 
    joinQueue, 
    leaveQueue, 
    matchmakingState, 
    opponent 
  } = useMatchmaking();
  const [isDistributing, setIsDistributing] = useState(true);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [opponentHand, setOpponentHand] = useState<Card[]>([]);

  // Initialize battle and connect to matchmaking
  useEffect(() => {
    const setupBattle = async () => {
      try {
        // Initialize local battle state
        await initializeBattle({
          is_bot: false,
          difficulty: 'medium'
        });

        // Initialize decks
        const playerDeck = createDeck('promotoria');
        const opponentDeck = createDeck('defesa');
        setPlayerHand(playerDeck.slice(0, 5));
        setOpponentHand(opponentDeck.slice(0, 5));

        // Join matchmaking queue
        await joinQueue({
          mode: 'casual',
          difficulty: 'medium'
        });

      } catch (error) {
        console.error('Failed to setup battle:', error);
        on_close?.();
      }
    };

    setupBattle();

    // Cleanup on unmount
    return () => {
      if (gameState.user?.id) {
        leaveQueue();
      }
    };
  }, [gameState.user?.id]);

  const handleCardSelect = async (cardId: string) => {
    if (!matchmakingState.matchId || phase !== BattleStateEnum.CARD_SELECTION) return;

    try {
      // Handle card selection
      // This will be implemented when we add the battle channel functionality
      console.log('Selected card:', cardId);
    } catch (error) {
      console.error('Failed to send card selection:', error);
    }
  };

  const handleDistributionComplete = () => {
    setIsDistributing(false);
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      {isDistributing ? (
        <CardDistribution
          playerHand={playerHand}
          opponentHand={opponentHand}
          onComplete={handleDistributionComplete}
        />
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          {/* Opponent's Hand */}
          <Box sx={{ transform: 'rotate(180deg)' }}>
            <BattleHand
              cards={opponentHand}
              isSelectable={false}
              onCardSelect={() => {}}
            />
          </Box>

          {/* Battle Field */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Add battle field content here */}
          </Box>

          {/* Player's Hand */}
          <BattleHand
            cards={playerHand}
            isSelectable={phase === BattleStateEnum.CARD_SELECTION}
            onCardSelect={handleCardSelect}
          />
        </Box>
      )}
    </Box>
  );
}