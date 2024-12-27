import { Box, Typography } from '@mui/material';
import { Card } from './BattleMode';

interface CardDisplayProps {
  cards: Card[];
  selectedCard: Card | null;
  onCardSelect: (card: Card) => void;
  disabled?: boolean;
}

export function CardDisplay({ cards, selectedCard, onCardSelect, disabled = false }: CardDisplayProps) {
  return (
    <Box sx={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 2,
      justifyContent: 'center',
      p: 2
    }}>
      {cards.map((card) => (
        <Box
          key={card.id}
          onClick={() => !disabled && !card.isUsed && onCardSelect(card)}
          sx={{
            width: 120,
            height: 180,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 1,
            p: 2,
            cursor: !disabled && !card.isUsed ? 'pointer' : 'default',
            opacity: card.isUsed ? 0.5 : 1,
            border: selectedCard?.id === card.id ? '2px solid' : '1px solid',
            borderColor: selectedCard?.id === card.id ? 'primary.main' : 'divider',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: !disabled && !card.isUsed ? 'translateY(-4px)' : 'none',
              boxShadow: !disabled && !card.isUsed ? 3 : 1
            },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
            {card.type === 'ataque' && '⚔️'}
            {card.type === 'defesa' && '🛡️'}
            {card.type === 'contra_ataque' && '↩️'}
            {card.type === 'wildcard' && '🃏'}
            <br />
            {card.type.charAt(0).toUpperCase() + card.type.slice(1)}
          </Typography>

          <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
            {card.description}
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {card.power}
          </Typography>
        </Box>
      ))}
    </Box>
  );
} 