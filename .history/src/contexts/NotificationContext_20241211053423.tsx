import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { Achievement } from '../types/achievements';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AchievementNotification from '../components/Achievements/AchievementNotification';

interface NotificationContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  showNotification: (notification: NotificationOptions) => void;
  notifyAchievementUnlock: (achievement: Achievement) => void;
}

export const NotificationContext = createContext<NotificationContextType | null>(null);

interface NotificationOptions {
  content: React.ReactNode;
  type?: 'success' | 'error' | 'warning' | 'info' | 'achievement';
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const showSuccess = useCallback((message: string) => {
    toast.success(message);
  }, []);

  const showError = useCallback((message: string) => {
    toast.error(message);
  }, []);

  const showWarning = useCallback((message: string) => {
    toast.warning(message);
  }, []);

  const showInfo = useCallback((message: string) => {
    toast.info(message);
  }, []);

  const notifyAchievementUnlock = useCallback((achievement: Achievement) => {
    toast(
      ({ closeToast }) => (
        <AchievementNotification
          achievement={achievement}
          onClose={closeToast}
          onShare={() => {
            navigator.share?.({
              title: 'Achievement Unlocked!',
              text: `I just unlocked ${achievement.title} in CepaC Play!`,
              url: window.location.href,
            }).catch(console.error);
          }}
        />
      ),
      {
        position: "bottom-right",
        autoClose: 5000,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: false,
        className: "achievement-toast"
      }
    );
  }, []);

  const showNotification = (notification: NotificationOptions) => {
    toast(notification.content);
  };

  const value = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    notifyAchievementUnlock,
    showNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      <ToastContainer />
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
} 
