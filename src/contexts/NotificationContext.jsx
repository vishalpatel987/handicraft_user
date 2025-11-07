import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import { 
  getReadNotifications, 
  getDismissedNotifications, 
  markNotificationAsRead, 
  dismissNotification as dismissNotificationUtil,
  markMultipleNotificationsAsRead,
  dismissMultipleNotifications,
  getNotificationStorageInfo
} from '../utils/notificationStorage';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from API and apply localStorage filters
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications();
      
      // Get read and dismissed notifications from localStorage using utility functions
      const readNotifications = getReadNotifications();
      const dismissedNotifications = getDismissedNotifications();
      
      // Get storage info for debugging
      const storageInfo = getNotificationStorageInfo();
      
      console.log('LocalStorage data:', {
        readNotifications,
        dismissedNotifications,
        totalAnnouncements: response.data.announcements?.length || 0,
        storageInfo
      });
      
      // Transform announcements to notifications with proper status
      const transformedNotifications = (response.data.announcements || []).map(announcement => ({
        _id: announcement._id,
        title: announcement.title,
        message: announcement.content,
        content: announcement.content,
        type: announcement.type || 'info',
        createdAt: announcement.createdAt,
        link: announcement.link,
        icon: announcement.icon || '🔔',
        isRead: readNotifications.includes(announcement._id),
        isDismissed: dismissedNotifications.includes(announcement._id)
      }));
      
      // Filter out dismissed notifications
      const visibleNotifications = transformedNotifications.filter(notif => !notif.isDismissed);
      
      // Count unread notifications (only those that are not read)
      const newUnreadCount = visibleNotifications.filter(notif => !notif.isRead).length;
      
      setNotifications(visibleNotifications);
      setUnreadCount(newUnreadCount);
      
      console.log('Global notifications updated:', {
        total: transformedNotifications.length,
        visible: visibleNotifications.length,
        unread: newUnreadCount,
        read: visibleNotifications.filter(notif => notif.isRead).length,
        dismissed: dismissedNotifications.length,
        announcements: transformedNotifications.map(n => ({
          id: n._id,
          title: n.title,
          isRead: n.isRead,
          isDismissed: n.isDismissed
        }))
      });
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    console.log('Marking notification as read:', notificationId);
    
    // Use utility function to mark as read
    const wasUpdated = markNotificationAsRead(notificationId);
    
    if (wasUpdated) {
      // Update local state
      setNotifications(prev => {
        const updated = prev.map(notif => 
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        );
        
        // Recalculate unread count
        const newUnreadCount = updated.filter(notif => !notif.isRead).length;
        setUnreadCount(newUnreadCount);
        
        console.log('Updated notifications state:', {
          total: updated.length,
          unread: newUnreadCount,
          read: updated.filter(notif => notif.isRead).length
        });
        
        return updated;
      });
    } else {
      console.log('Notification already marked as read or error occurred:', notificationId);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    console.log('Marking all notifications as read');
    
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
    console.log('Unread notification IDs:', unreadIds);
    
    if (unreadIds.length > 0) {
      // Use utility function to mark multiple notifications as read
      const wasUpdated = markMultipleNotificationsAsRead(unreadIds);
      
      if (wasUpdated) {
        // Update local state
        setNotifications(prev => {
          const updated = prev.map(notif => ({ ...notif, isRead: true }));
          setUnreadCount(0);
          return updated;
        });
        
        console.log('All notifications marked as read, unread count reset to 0');
      } else {
        console.log('Error marking all notifications as read');
      }
    } else {
      console.log('No unread notifications to mark as read');
    }
  };

  // Dismiss notification
  const dismissNotification = (notificationId) => {
    console.log('Dismissing notification:', notificationId);
    
    // Use utility function to dismiss notification
    const wasUpdated = dismissNotificationUtil(notificationId);
    
    if (wasUpdated) {
      // Update local state
      setNotifications(prev => {
        const updated = prev.map(notif => 
          notif._id === notificationId ? { ...notif, isDismissed: true } : notif
        );
        
        // Recalculate unread count (exclude dismissed)
        const newUnreadCount = updated.filter(notif => !notif.isRead && !notif.isDismissed).length;
        setUnreadCount(newUnreadCount);
        
        console.log('Notification dismissed, updated unread count:', newUnreadCount);
        
        return updated;
      });
    } else {
      console.log('Notification already dismissed or error occurred:', notificationId);
    }
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    console.log('Clearing all notifications');
    
    const allIds = notifications.map(n => n._id);
    console.log('All notification IDs to dismiss:', allIds);
    
    // Use utility function to dismiss multiple notifications
    const wasUpdated = dismissMultipleNotifications(allIds);
    
    if (wasUpdated) {
      // Update local state - remove all notifications from view
      setNotifications([]);
      
      // Reset unread count
      setUnreadCount(0);
      
      console.log('All notifications cleared, unread count reset to 0');
    } else {
      console.log('Error clearing all notifications');
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'read_notifications' || e.key === 'dismissed_notifications') {
        console.log('Storage change detected:', e.key);
        fetchNotifications();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Debug function to clear all notification data
  const clearAllNotificationData = () => {
    console.log('Clearing all notification data from localStorage');
    localStorage.removeItem('read_notifications');
    localStorage.removeItem('dismissed_notifications');
    fetchNotifications();
  };

  // Add debug functions to window for testing
  useEffect(() => {
    window.clearNotificationData = clearAllNotificationData;
    window.refreshNotifications = fetchNotifications;
    window.getNotificationStorageInfo = getNotificationStorageInfo;
    return () => {
      delete window.clearNotificationData;
      delete window.refreshNotifications;
      delete window.getNotificationStorageInfo;
    };
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
