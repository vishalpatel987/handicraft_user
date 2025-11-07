import axios from 'axios';
import env from '../config/env';

const API_BASE_URL = env.API_BASE_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const announcementService = {
  // Get active announcements for specific location
  getActiveAnnouncements: async (location = 'all') => {
    try {
      const response = await api.get('/api/announcements/public', { params: { location } });
      return response.data;
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }
  },

  // Get all active announcements for notifications
  getAllActiveAnnouncements: async () => {
    try {
      const response = await api.get('/api/announcements/public', { params: { location: 'all' } });
      return response.data;
    } catch (error) {
      console.error('Error fetching all announcements:', error);
      throw error;
    }
  },

  // Increment views
  incrementViews: async (id) => {
    try {
      await api.post(`/api/announcements/public/${id}/view`);
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  },

  // Increment clicks
  incrementClicks: async (id) => {
    try {
      await api.post(`/api/announcements/public/${id}/click`);
    } catch (error) {
      console.error('Error incrementing clicks:', error);
    }
  },

  // Get notification count (local storage based)
  getNotificationCount: () => {
    const readNotifications = JSON.parse(localStorage.getItem('read_notifications') || '[]');
    const dismissedNotifications = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
    
    // This will be updated when notifications are fetched
    return 0; // Placeholder, actual count calculated in component
  },

  // Mark notification as read
  markAsRead: (notificationId) => {
    const readNotifications = JSON.parse(localStorage.getItem('read_notifications') || '[]');
    if (!readNotifications.includes(notificationId)) {
      readNotifications.push(notificationId);
      localStorage.setItem('read_notifications', JSON.stringify(readNotifications));
    }
  },

  // Mark notification as dismissed
  markAsDismissed: (notificationId) => {
    const dismissedNotifications = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
    if (!dismissedNotifications.includes(notificationId)) {
      dismissedNotifications.push(notificationId);
      localStorage.setItem('dismissed_notifications', JSON.stringify(dismissedNotifications));
    }
  },

  // Clear all notifications
  clearAllNotifications: () => {
    localStorage.setItem('read_notifications', JSON.stringify([]));
    localStorage.setItem('dismissed_notifications', JSON.stringify([]));
  },
};

export default announcementService;

