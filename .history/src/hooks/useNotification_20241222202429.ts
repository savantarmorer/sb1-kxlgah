import { useSnackbar } from 'notistack';

export function useNotification() {
  const { enqueueSnackbar } = useSnackbar();

  const showError = (message: string) => {
    enqueueSnackbar(message, { 
      variant: 'error',
      autoHideDuration: 3000
    });
  };

  const showSuccess = (message: string) => {
    enqueueSnackbar(message, { 
      variant: 'success',
      autoHideDuration: 3000
    });
  };

  const showInfo = (message: string) => {
    enqueueSnackbar(message, { 
      variant: 'info',
      autoHideDuration: 3000
    });
  };

  return { showError, showSuccess, showInfo };
}
