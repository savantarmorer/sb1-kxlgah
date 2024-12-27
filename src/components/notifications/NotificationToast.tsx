import React from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { NotificationItem } from '../../types/notifications';
import { isReward, isAchievement, isQuest } from '../../utils/typeGuards';
import { RewardToast, AchievementToast, QuestToast } from './toasts';

interface NotificationToastProps {
  notification: NotificationItem;
  onDismiss: () => void;
}

export function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
  // ... rest of the component implementation
} 

