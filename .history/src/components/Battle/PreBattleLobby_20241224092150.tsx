import { Box, Button, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';

interface PreBattleLobbyProps {
  onBattleStart: () => void;
  onCancel: () => void;
  onModeSelect: (mode: string) => void;
  selectedMode: string;
}

export function PreBattleLobby({ onBattleStart, onCancel, onModeSelect, selectedMode }: PreBattleLobbyProps) {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      p: 4,
      height: '100%'
    }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
        Prepare for Battle!
      </Typography>

      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Select Battle Mode
        </Typography>
        <ToggleButtonGroup
          value={selectedMode}
          exclusive
          onChange={(_, value) => value && onModeSelect(value)}
          aria-label="battle mode"
          sx={{ mb: 2 }}
        >
          <ToggleButton value="all" aria-label="all subjects">
            All Subjects
          </ToggleButton>
          <ToggleButton value="constitutional" aria-label="constitutional law">
            Constitutional
          </ToggleButton>
          <ToggleButton value="civil" aria-label="civil law">
            Civil
          </ToggleButton>
          <ToggleButton value="criminal" aria-label="criminal law">
            Criminal
          </ToggleButton>
          <ToggleButton value="administrative" aria-label="administrative law">
            Administrative
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={onCancel}
          sx={{ minWidth: 120 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onBattleStart}
          sx={{ minWidth: 120 }}
        >
          Start Battle
        </Button>
      </Box>
    </Box>
  );
} 