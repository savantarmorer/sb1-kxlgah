import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useNotification } from '../../contexts/NotificationContext';

export function NotificationHandler() {
  const { notifications, removeNotification } = useNotification();

  const handleClose = (id: string) => {
    removeNotification(id);
  };

  return (
    <>
      {notifications?.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.duration || 3000}
          onClose={() => handleClose(notification.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={() => handleClose(notification.id)}
            severity={notification.type}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
}

export default NotificationHandler; 