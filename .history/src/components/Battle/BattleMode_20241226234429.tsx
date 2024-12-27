import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { BattleStateEnum } from '../../types/battle';
import { CardDistribution } from './CardDistribution';
import { createDeck, drawCards, Card, getAICardSelection } from '../../utils/cardUtils';
import { useBattle } from '../../hooks/useBattle';

export function BattleMode() {
  const theme = useTheme();
  const { state: battleState, dispatch } = useBattle();
  const [playerDeck, setPlayerDeck] = React.useState<Card[]>([]);
  const [opponentDeck, setOpponentDeck] = React.useState<Card[]>([]);
  const [playerHand, setPlayerHand] = React.useState<Card[]>([]);
  const [opponentHand, setOpponentHand] = React.useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = React.useState<Card | null>(null);

  // Initialize decks
  React.useEffect(() => {
    if (battleState.status === BattleStateEnum.PREPARING) {
      const newPlayerDeck = createDeck(battleState.player_role);
      const newOpponentDeck = createDeck(battleState.opponent_role);
      setPlayerDeck(newPlayerDeck);
      setOpponentDeck(newOpponentDeck);
      
      // Draw initial hands
      const playerDrawResult = drawCards(newPlayerDeck, 5);
      const opponentDrawResult = drawCards(newOpponentDeck, 5);
      
      setPlayerHand(playerDrawResult.drawn);
      setOpponentHand(opponentDrawResult.drawn);
      setPlayerDeck(playerDrawResult.remaining);
      setOpponentDeck(opponentDrawResult.remaining);

      dispatch({ type: 'SET_BATTLE_STATUS', payload: BattleStateEnum.CARD_SELECTION });
    }
  }, [battleState.status, battleState.player_role, battleState.opponent_role, dispatch]);

  // Handle card selection
  const handleCardSelect = (card: Card) => {
    if (battleState.status !== BattleStateEnum.CARD_SELECTION) return;
    setSelectedCard(card);
    
    // Get AI opponent's card selection
    const opponentCard = getAICardSelection(
      opponentHand,
      card,
      battleState.score.player,
      battleState.score.opponent
    );
    
    // Play the cards
    dispatch({
      type: 'UPDATE_BATTLE_PROGRESS',
      payload: {
        playerCard: card,
        opponentCard
      }
    });

    // Remove played cards from hands
    setPlayerHand(prev => prev.filter(c => c.id !== card.id));
    setOpponentHand(prev => prev.filter(c => c.id !== opponentCard.id));

    // Draw new cards if needed
    if (playerDeck.length > 0 && playerHand.length < 5) {
      const playerDrawResult = drawCards(playerDeck, 1);
      setPlayerHand(prev => [...prev, ...playerDrawResult.drawn]);
      setPlayerDeck(playerDrawResult.remaining);
    }
    if (opponentDeck.length > 0 && opponentHand.length < 5) {
      const opponentDrawResult = drawCards(opponentDeck, 1);
      setOpponentHand(prev => [...prev, ...opponentDrawResult.drawn]);
      setOpponentDeck(opponentDrawResult.remaining);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        bgcolor: theme.palette.background.default
      }}
    >
      {/* Score Display */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" align="center">
          {battleState.score.player} - {battleState.score.opponent}
        </Typography>
      </Box>

      {/* Opponent's Hand */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 4
        }}
      >
        {opponentHand.map(card => (
          <Box
            key={card.id}
            sx={{
              width: 120,
              height: 160,
              borderRadius: 2,
              bgcolor: theme.palette.primary.dark,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotateY(180deg)'
            }}
          >
            <Typography variant="h6" color="white">?</Typography>
          </Box>
        ))}
      </Box>

      {/* Battle Area / Last Played Cards */}
      <Box
        sx={{
          display: 'flex',
          gap: 4,
          mb: 4,
          minHeight: 200,
          alignItems: 'center'
        }}
      >
        {battleState.last_played_cards && (
          <>
            <Box
              sx={{
                width: 120,
                height: 160,
                borderRadius: 2,
                bgcolor: theme.palette.primary.main,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1
              }}
            >
              <Typography variant="h6">{battleState.last_played_cards.player.name}</Typography>
              <Typography>Força: {battleState.last_played_cards.player.forca}</Typography>
              <Typography>Poder: {battleState.last_played_cards.player.poder}</Typography>
            </Box>
            <Typography variant="h4">VS</Typography>
            <Box
              sx={{
                width: 120,
                height: 160,
                borderRadius: 2,
                bgcolor: theme.palette.secondary.main,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1
              }}
            >
              <Typography variant="h6">{battleState.last_played_cards.opponent.name}</Typography>
              <Typography>Força: {battleState.last_played_cards.opponent.forca}</Typography>
              <Typography>Poder: {battleState.last_played_cards.opponent.poder}</Typography>
            </Box>
          </>
        )}
      </Box>

      {/* Player's Hand */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mt: 'auto'
        }}
      >
        {playerHand.map(card => (
          <Box
            key={card.id}
            onClick={() => handleCardSelect(card)}
            sx={{
              width: 120,
              height: 160,
              borderRadius: 2,
              bgcolor: theme.palette.primary.main,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              p: 1,
              '&:hover': {
                transform: 'translateY(-10px)',
                transition: 'transform 0.2s'
              }
            }}
          >
            <Typography variant="h6">{card.name}</Typography>
            <Typography>Força: {card.forca}</Typography>
            <Typography>Poder: {card.poder}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}