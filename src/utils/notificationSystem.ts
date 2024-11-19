import { toast } from 'react-hot-toast';
import { AchievementToast, QuestToast, RewardToast } from '../components/notifications/NotificationToast';
import { Achievement } from '../types/achievements';
import { Quest } from '../types/quests';
import { Reward } from '../types/rewards';

export const NotificationSystem = {
  showAchievement: (achievement: Achievement) => {
    toast.custom((t) => AchievementToast({ visible: t.visible, achievement }), {
      duration: 4000
    });
  },

  showQuestComplete: (quest: Quest) => {
    toast.custom((t) => QuestToast({ visible: t.visible, quest }), {
      duration: 4000
    });
  },

  showReward: (reward: Reward) => {
    toast.custom((t) => RewardToast({ visible: t.visible, reward }), {
      duration: 3000
    });
  },

  showError: (message: string) => {
    toast.error(message);
  },

  showSuccess: (message: string) => {
    toast.success(message);
  }
}; 