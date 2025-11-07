// Utility functions for managing notification storage

export const NOTIFICATION_STORAGE_KEYS = {
  READ: 'read_notifications',
  DISMISSED: 'dismissed_notifications'
};

// Get read notifications from localStorage
export const getReadNotifications = () => {
  try {
    const readNotifications = localStorage.getItem(NOTIFICATION_STORAGE_KEYS.READ);
    return readNotifications ? JSON.parse(readNotifications) : [];
  } catch (error) {
    console.error('Error reading read notifications from localStorage:', error);
    return [];
  }
};

// Get dismissed notifications from localStorage
export const getDismissedNotifications = () => {
  try {
    const dismissedNotifications = localStorage.getItem(NOTIFICATION_STORAGE_KEYS.DISMISSED);
    return dismissedNotifications ? JSON.parse(dismissedNotifications) : [];
  } catch (error) {
    console.error('Error reading dismissed notifications from localStorage:', error);
    return [];
  }
};

// Add notification to read list
export const markNotificationAsRead = (notificationId) => {
  try {
    const readNotifications = getReadNotifications();
    if (!readNotifications.includes(notificationId)) {
      const updatedReadNotifications = [...readNotifications, notificationId];
      localStorage.setItem(NOTIFICATION_STORAGE_KEYS.READ, JSON.stringify(updatedReadNotifications));
      console.log('Notification marked as read:', notificationId);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

// Add notification to dismissed list
export const dismissNotification = (notificationId) => {
  try {
    const dismissedNotifications = getDismissedNotifications();
    if (!dismissedNotifications.includes(notificationId)) {
      const updatedDismissedNotifications = [...dismissedNotifications, notificationId];
      localStorage.setItem(NOTIFICATION_STORAGE_KEYS.DISMISSED, JSON.stringify(updatedDismissedNotifications));
      console.log('Notification dismissed:', notificationId);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error dismissing notification:', error);
    return false;
  }
};

// Mark multiple notifications as read
export const markMultipleNotificationsAsRead = (notificationIds) => {
  try {
    const readNotifications = getReadNotifications();
    const newReadNotifications = [...readNotifications];
    
    notificationIds.forEach(id => {
      if (!newReadNotifications.includes(id)) {
        newReadNotifications.push(id);
      }
    });
    
    localStorage.setItem(NOTIFICATION_STORAGE_KEYS.READ, JSON.stringify(newReadNotifications));
    console.log('Multiple notifications marked as read:', notificationIds);
    return true;
  } catch (error) {
    console.error('Error marking multiple notifications as read:', error);
    return false;
  }
};

// Dismiss multiple notifications
export const dismissMultipleNotifications = (notificationIds) => {
  try {
    const dismissedNotifications = getDismissedNotifications();
    const newDismissedNotifications = [...dismissedNotifications];
    
    notificationIds.forEach(id => {
      if (!newDismissedNotifications.includes(id)) {
        newDismissedNotifications.push(id);
      }
    });
    
    localStorage.setItem(NOTIFICATION_STORAGE_KEYS.DISMISSED, JSON.stringify(newDismissedNotifications));
    console.log('Multiple notifications dismissed:', notificationIds);
    return true;
  } catch (error) {
    console.error('Error dismissing multiple notifications:', error);
    return false;
  }
};

// Clear all notification data
export const clearAllNotificationData = () => {
  try {
    localStorage.removeItem(NOTIFICATION_STORAGE_KEYS.READ);
    localStorage.removeItem(NOTIFICATION_STORAGE_KEYS.DISMISSED);
    console.log('All notification data cleared from localStorage');
    return true;
  } catch (error) {
    console.error('Error clearing notification data:', error);
    return false;
  }
};

// Check if notification is read
export const isNotificationRead = (notificationId) => {
  const readNotifications = getReadNotifications();
  return readNotifications.includes(notificationId);
};

// Check if notification is dismissed
export const isNotificationDismissed = (notificationId) => {
  const dismissedNotifications = getDismissedNotifications();
  return dismissedNotifications.includes(notificationId);
};

// Get notification storage info for debugging
export const getNotificationStorageInfo = () => {
  const readNotifications = getReadNotifications();
  const dismissedNotifications = getDismissedNotifications();
  
  return {
    readCount: readNotifications.length,
    dismissedCount: dismissedNotifications.length,
    readIds: readNotifications,
    dismissedIds: dismissedNotifications,
    localStorageSize: JSON.stringify(localStorage).length
  };
};
