import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { AlertTriangle } from 'lucide-react';
import { use_language } from '../../contexts/LanguageContext';

interface BattleErrorBoundaryProps {
  message: string;
  onRetry?: () => void;
}

export function BattleErrorBoundary({ message, onRetry }: BattleErrorBoundaryProps) {
  const { t } = use_language();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 4,
        textAlign: 'center',
        bgcolor: 'error.main',
        color: 'error.contrastText',
        borderRadius: 2
      }}
    >
      <AlertTriangle size={48} />
      <Typography variant="h6">{t('battle.error.title')}</Typography>
      <Typography>{message}</Typography>
      {onRetry && (
        <Button
          variant="contained"
          color="inherit"
          onClick={onRetry}
          sx={{ mt: 2 }}
        >
          {t('battle.error.retry')}
        </Button>
      )}
    </Box>
  );
} 