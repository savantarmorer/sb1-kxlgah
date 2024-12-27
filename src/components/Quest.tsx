import React from 'react';
import { Quest, QuestStatus, QuestType, QuestRequirement } from '../types/quests';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Stack,
  Button,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// At the top of the file, define the status type to match the object keys
type QuestStatusStyles = 'available' | 'in_progress' | 'completed' | 'failed' | 'expired';

const QuestCard = styled(Card)<{ status: QuestStatus }>(({ theme, status }) => ({
  border: `2px solid ${
    {
      [QuestStatus.AVAILABLE]: theme.palette.info.main,
      [QuestStatus.IN_PROGRESS]: theme.palette.warning.main,
      [QuestStatus.COMPLETED]: theme.palette.success.main,
      [QuestStatus.FAILED]: theme.palette.error.main
    }[status]
  }`,
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

const StatusChip = styled(Chip)<{ status: QuestStatus }>(({ theme, status }) => ({
  backgroundColor: {
    [QuestStatus.AVAILABLE]: theme.palette.info.main,
    [QuestStatus.IN_PROGRESS]: theme.palette.warning.main,
    [QuestStatus.COMPLETED]: theme.palette.success.main,
    [QuestStatus.FAILED]: theme.palette.error.main
  }[status],
  color: theme.palette.getContrastText(
    {
      [QuestStatus.AVAILABLE]: theme.palette.info.main,
      [QuestStatus.IN_PROGRESS]: theme.palette.warning.main,
      [QuestStatus.COMPLETED]: theme.palette.success.main,
      [QuestStatus.FAILED]: theme.palette.error.main
    }[status]
  ),
}));

interface QuestProgressProps {
  current: number;
  target: number;
}

const QuestProgress: React.FC<QuestProgressProps> = ({ current, target }) => {
  const progress = Math.min((current / target) * 100, 100);

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Progress
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {current}/{target}
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={progress} />
    </Box>
  );
};

interface QuestRewardsProps {
  xp: number;
  coins: number;
}

const QuestRewards: React.FC<QuestRewardsProps> = ({ xp, coins }) => (
  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
    <Chip
      label={`${xp} XP`}
      size="small"
      color="primary"
    />
    <Chip
      label={`${coins} Coins`}
      size="small"
      color="secondary"
    />
  </Stack>
);

interface QuestComponentProps {
  quest: Quest;
  onAccept?: (quest: Quest) => void;
  onAbandon?: (quest: Quest) => void;
}

export const QuestComponent: React.FC<QuestComponentProps> = ({
  quest,
  onAccept,
  onAbandon,
}) => {
  const totalProgress = quest.requirements.reduce(
    (acc: number, req: QuestRequirement) => acc + (req.current / req.target) * 100,
    0
  );

  return (
    <QuestCard status={quest.status}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="div">
            {quest.title}
          </Typography>
          <StatusChip
            label={quest.status.replace('_', ' ')}
            size="small"
            status={quest.status}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {quest.description}
        </Typography>

        <Stack spacing={2}>
          {quest.requirements.map((req: QuestRequirement, index: number) => (
            <Box key={index}>
              <Typography variant="body2" color="text.secondary">
                {req.type === QuestType.BATTLE && 'Win Battles'}
                {req.type === QuestType.STUDY && 'Study Time'}
                {req.type === QuestType.ACHIEVEMENT && 'Unlock Achievements'}
                {req.type === QuestType.STREAK && 'Maintain Streak'}
                {req.type === QuestType.COLLECTION && 'Collect Items'}
                {req.type === QuestType.SOCIAL && 'Social Actions'}
              </Typography>
              <QuestProgress current={req.current} target={req.target} />
            </Box>
          ))}
        </Stack>

        <QuestRewards xp={quest.xp_reward} coins={quest.coin_reward} />

        {quest.status === QuestStatus.AVAILABLE && onAccept && (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => onAccept(quest)}
          >
            Accept Quest
          </Button>
        )}

        {quest.status === QuestStatus.IN_PROGRESS && onAbandon && (
          <Button
            variant="outlined"
            color="error"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => onAbandon(quest)}
          >
            Abandon Quest
          </Button>
        )}

        {quest.expires_at && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2, textAlign: 'center' }}
          >
            Expires: {new Date(quest.expires_at).toLocaleDateString()}
          </Typography>
        )}
      </CardContent>
    </QuestCard>
  );
};
