import { toast } from 'react-hot-toast';

interface NotificationOptions {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export const NotificationService = {
  /**
   * Show a success notification
   * @param options Notification configuration
   */
  showSuccess: (options: NotificationOptions) => {
    toast.success(options.message, {
      duration: options.duration || 4000,
      position: 'top-right',
      // Optional: Add title if provided
      ...(options.title && { 
        style: { 
          background: '#4CAF50', 
          color: 'white',
          padding: '16px',
          borderRadius: '8px'
        },
        // Render title and message separately
        render: () => (
          `${options.title ? `${options.title}: ` : ''}${options.message}`
        )
      })
    });
  },

  /**
   * Show an error notification
   * @param options Notification configuration
   */
  showError: (options: NotificationOptions) => {
    toast.error(options.message, {
      duration: options.duration || 4000,
      position: 'top-right',
      // Optional: Add title if provided
      ...(options.title && { 
        style: { 
          background: '#F44336', 
          color: 'white',
          padding: '16px',
          borderRadius: '8px'
        },
        // Render title and message separately
        render: () => (
          `${options.title ? `${options.title}: ` : ''}${options.message}`
        )
      })
    });
  },

  /**
   * Show a warning notification
   * @param options Notification configuration
   */
  showWarning: (options: NotificationOptions) => {
    toast(options.message, {
      duration: options.duration || 4000,
      position: 'top-right',
      style: { 
        background: '#FF9800', 
        color: 'white',
        padding: '16px',
        borderRadius: '8px'
      },
      // Optional: Add title if provided
      ...(options.title && { 
        render: () => (
          `${options.title ? `${options.title}: ` : ''}${options.message}`
        )
      })
    });
  },

  /**
   * Show an informational notification
   * @param options Notification configuration
   */
  showInfo: (options: NotificationOptions) => {
    toast(options.message, {
      duration: options.duration || 4000,
      position: 'top-right',
      style: { 
        background: '#2196F3', 
        color: 'white',
        padding: '16px',
        borderRadius: '8px'
      },
      // Optional: Add title if provided
      ...(options.title && { 
        render: () => (
          `${options.title ? `${options.title}: ` : ''}${options.message}`
        )
      })
    });
  },

  /**
   * Clear all notifications
   */
  clear: () => {
    toast.dismiss();
  }
};
