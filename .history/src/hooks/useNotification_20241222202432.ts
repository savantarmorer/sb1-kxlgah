import { toast } from 'react-toastify';

export function useNotification() {
  return {
    showSuccess: (message: string) => toast.success(message),
    showError: (message: string) => toast.error(message)
  };
}
