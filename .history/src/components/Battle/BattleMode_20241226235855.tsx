import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useGame } from '../../contexts/GameContext';
import { BattleStateEnum } from '../../types/battle';
import { LiveMatchmakingService } from '../../services/liveMatchmakingService';
import { useBattle } from '../../hooks/useBattle';
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
  const [matchId, setMatchId] = useState<string | null>(null);
  const [isDistributing, setIsDistributing] = useState(true);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [opponentHand, setOpponentHand] = useState<Card[]>([]);

  // Initialize battle and connect to matchmaking
  useEffect(() => {
    const setupBattle = async () => {
      try {
        // Initialize local battle state
        await initializeBattle({
          player_role: 'promotoria',
          opponent: {
            is_bot: false,
            difficulty: 1
          }
        });

        // Initialize decks
        const playerDeck = createDeck('promotoria');
        const opponentDeck = createDeck('defesa');
        setPlayerHand(playerDeck.slice(0, 5));
        setOpponentHand(opponentDeck.slice(0, 5));

        // Connect to matchmaking service
        if (gameState.user?.id) {
          await LiveMatchmakingService.joinQueue(gameState.user.id, {
            rating: gameState.battle_stats?.tournament_rating || 1000,
            level: gameState.user?.level || 1,
            preferences: {
              mode: 'casual',
              difficulty: 'medium'
            }
          });

          // Listen for match updates
          LiveMatchmakingService.subscribeToMatchUpdates(gameState.user.id, (state) => {
            if (state.status === 'matched') {
              setMatchId(state.matchId || null);
            }
          });
        }

      } catch (error) {
        console.error('Failed to setup battle:', error);
        on_close?.();
      }
    };

    setupBattle();

    // Cleanup on unmount
    return () => {
      if (gameState.user?.id) {
        LiveMatchmakingService.leaveQueue(gameState.user.id);
      }
    };
  }, [gameState.user?.id]);

  const handleCardSelect = async (cardId: string) => {
    if (!matchId || phase !== BattleStateEnum.CARD_SELECTION) return;

    try {
      // Broadcast selection to opponent
      await LiveMatchmakingService.getBattleChannel(matchId)?.send({
        type: 'broadcast',
        event: 'card_selected',
        payload: { cardId, playerId: gameState.user?.id }
      });
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