import React, { createContext, useContext, useCallback, ReactNode, useEffect } from 'react';
import { Achievement } from '../types/achievements';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AchievementNotification from '../components/Achievements/AchievementNotification';
import { NotificationSystem } from '../utils/notifications';

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
            });
          }}
        />
      ),
      {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  }, []);

  const showNotification = useCallback(({ content, type = 'info' }: NotificationOptions) => {
    switch (type) {
      case 'success':
        toast.success(content);
        break;
      case 'error':
        toast.error(content);
        break;
      case 'warning':
        toast.warning(content);
        break;
      case 'achievement':
        toast(content, {
          position: 'top-center',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        break;
      default:
        toast.info(content);
    }
  }, []);

  // Initialize NotificationSystem handlers
  useEffect(() => {
    NotificationSystem.getInstance().setHandlers({
      success: showSuccess,
      error: showError,
      warning: showWarning,
      info: showInfo,
      achievementUnlock: notifyAchievementUnlock
    });
  }, [showSuccess, showError, showWarning, showInfo, notifyAchievementUnlock]);

  const value = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification,
    notifyAchievementUnlock
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}; 
