import React, { createContext, useContext, useState, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationItem {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  showNotification: (notification: Omit<NotificationItem, 'id'>) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showNotification = useCallback((notification: Omit<NotificationItem, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { ...notification, id }]);

    // Auto remove notification after duration
    setTimeout(() => {
      removeNotification(id);
    }, notification.duration || 3000);
  }, [removeNotification]);

  const showSuccess = useCallback((message: string) => {
    showNotification({
      message,
      type: 'success',
      duration: 3000
    });
  }, [showNotification]);

  const showError = useCallback((message: string) => {
    showNotification({
      message,
      type: 'error',
      duration: 3000
    });
  }, [showNotification]);

  const value = {
    notifications,
    showNotification,
    showSuccess,
    showError,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
} 
