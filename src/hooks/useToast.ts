import React from 'react';
import { toast } from 'react-hot-toast';

interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

export function useToast() {
  const showToast = React.useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', options?: ToastOptions) => {
    const toastContent = React.createElement(
      'div',
      {
        className: 'flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg',
        role: 'alert'
      },
      [
        React.createElement(
          'div',
          { className: 'flex-1' },
          React.createElement(
            'p',
            {
              className: 'text-sm text-gray-900 dark:text-gray-100'
            },
            message
          )
        )
      ]
    );

    const toastOptions = {
      duration: options?.duration || 5000,
      position: options?.position || 'top-right',
      className: 'toast-message'
    };

    switch (type) {
      case 'success':
        toast.success(toastContent, toastOptions);
        break;
      case 'error':
        toast.error(toastContent, toastOptions);
        break;
      default:
        toast(toastContent, toastOptions);
    }
  }, []);

  return { showToast };
} 