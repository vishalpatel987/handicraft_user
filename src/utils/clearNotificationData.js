// Utility function to clear all notification-related localStorage data
export const clearNotificationData = () => {
  try {
    localStorage.removeItem('notifications');
    localStorage.removeItem('read_notifications');
    localStorage.removeItem('dismissed_notifications');
    console.log('All notification data cleared from localStorage');
  } catch (error) {
    console.error('Error clearing notification data:', error);
  }
};

// Add to window for easy access in browser console
if (typeof window !== 'undefined') {
  window.clearNotificationData = clearNotificationData;
}
