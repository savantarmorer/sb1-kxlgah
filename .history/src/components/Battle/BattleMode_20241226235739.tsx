import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useGame } from '../../contexts/GameContext';
import { createDeck, drawCards } from '../../utils/cardUtils';
import type { BattleState, PlayerState } from '../../types/battle';
import { LiveMatchmakingService } from '../../services/liveMatchmakingService';
import { useBattle } from '../../hooks/useBattle';
import { BattleStateEnum } from '../../types/battle';
import { CardDistribution } from './CardDistribution';
import type { Card } from '../../utils/cardUtils';

interface BattleModeProps {
  on_close?: () => void;
}

const INITIAL_HAND_SIZE = 3;

export default function BattleMode({ on_close }: BattleModeProps) {
  const { state: gameState } = useGame();
  const battle = gameState.battle as BattleState | null;
  const { initializeBattle, handleAnswer } = useBattle();
  const [matchId, setMatchId] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    health: 100,
    shield: 0,
    isReady: false
  });
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [opponentHand, setOpponentHand] = useState<Card[]>([]);

  // Initialize battle and connect to matchmaking
  useEffect(() => {
    const setupBattle = async () => {
      try {
        // Initialize local battle state
        await initializeBattle();

        // Initialize decks and draw initial hands
        const playerDeck = createDeck(battle?.player_role || 'promotoria');
        const opponentDeck = createDeck(battle?.opponent_role || 'defesa');

        const { drawn: playerInitialHand } = drawCards(playerDeck, INITIAL_HAND_SIZE);
        const { drawn: opponentInitialHand } = drawCards(opponentDeck, INITIAL_HAND_SIZE);

        setPlayerHand(playerInitialHand);
        setOpponentHand(opponentInitialHand);

        // Connect to matchmaking service
        const matchmakingState = await LiveMatchmakingService.joinQueue(gameState.user?.id || '', {
          rating: gameState.battle_stats?.rating || 1000,
          level: gameState.user?.level || 1,
          preferences: {
            mode: 'casual',
            difficulty: 'medium'
          }
        });

        // Listen for match updates
        LiveMatchmakingService.onStateChange(gameState.user?.id || '', (state) => {
          if (state.status === 'matched') {
            setMatchId(state.matchId || null);
          }
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
        LiveMatchmakingService.leaveQueue(gameState.user.id);
      }
    };
  }, [gameState.user?.id, battle?.player_role, battle?.opponent_role]);

  // Handle player ready state
  useEffect(() => {
    if (matchId && !playerState.isReady) {
      LiveMatchmakingService.confirmPlayerReady(matchId, gameState.user?.id || '')
        .then(() => {
          setPlayerState(prev => ({ ...prev, isReady: true }));
        })
        .catch(console.error);
    }
  }, [matchId, playerState.isReady, gameState.user?.id]);

  const handleCardSelect = async (cardId: string) => {
    if (!matchId || battle?.status !== BattleStateEnum.CARD_SELECTION) return;

    try {
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
    // Handle any post-distribution logic here
    console.log('Card distribution completed');
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
      <CardDistribution
        playerHand={playerHand}
        opponentHand={opponentHand}
        onComplete={handleDistributionComplete}
      />
    </Box>
  );
}