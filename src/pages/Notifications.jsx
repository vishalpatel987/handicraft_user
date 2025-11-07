import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, X, Calendar, ExternalLink, ArrowLeft, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';

const Notifications = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, dismissNotification, clearAllNotifications } = useNotifications();
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showFullMessage, setShowFullMessage] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // No need to fetch notifications here - they're managed by the context
  }, []);

  const handleNotificationClick = (notification) => {
    // Mark as read when clicked (but don't remove from list)
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    // Don't navigate to link automatically - let user click the Link button if they want to
    // This prevents accidental navigation when just trying to read the message
  };

  const handleViewFullMessage = (notification) => {
    setSelectedNotification(notification);
    setShowFullMessage(true);
  };

  const handleLinkClick = (notification) => {
    // Mark as read when link is clicked
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    // Navigate to the link
    if (notification.link?.url) {
      if (notification.link.url.startsWith('http')) {
        window.open(notification.link.url, '_blank');
      } else {
        navigate(notification.link.url);
      }
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    // Don't show dismissed notifications
    if (notification.isDismissed) return false;
    
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationTypeColor = (type) => {
    switch (type) {
      case 'promotion': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'product': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'order': return 'bg-green-100 text-green-800 border-green-200';
      case 'system': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-blue-100 rounded-full">
                <Bell className="w-3 h-3 text-blue-600" />
              </div>
              <div>
                <h1 className="text-base md:text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-xs text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 rounded"
                >
                  <span className="hidden md:inline">Mark all as read</span>
                  <span className="md:hidden">Mark all</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 transition-colors bg-red-50 hover:bg-red-100 rounded"
                >
                  <span className="hidden md:inline">Clear all</span>
                  <span className="md:hidden">Clear</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'read', label: 'Read', count: notifications.length - unreadCount }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 md:flex-none px-2 md:px-4 py-3 text-sm font-medium transition-colors relative ${
                  filter === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1 md:gap-2">
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-1.5 md:px-2 py-0.5 md:py-1 text-xs rounded-full ${
                      filter === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading notifications</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchNotifications}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Bell className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
            </h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'We\'ll notify you when there\'s something new!' 
                : `You don't have any ${filter} notifications right now.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative ${
                  !notification.isRead ? 'border-l-4 border-l-blue-500' : 'border-gray-200'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="p-2">
                  <div className="flex items-start gap-2">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        !notification.isRead ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {notification.icon || '🔔'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={`font-semibold text-xs ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                      </div>

                      <p className="text-gray-600 mb-1 leading-relaxed text-xs">
                        {notification.message.length > 60 ? 
                          `${notification.message.substring(0, 60)}...` : 
                          notification.message
                        }
                      </p>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(notification.createdAt)}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
                
                {/* Type badge in bottom corner */}
                <div className="absolute bottom-2 right-2">
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${
                    getNotificationTypeColor(notification.type)
                  }`}>
                    {notification.type}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Full Message Modal */}
      {showFullMessage && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  !selectedNotification.isRead ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {selectedNotification.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedNotification.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(selectedNotification.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFullMessage(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  getNotificationTypeColor(selectedNotification.type)
                }`}>
                  {selectedNotification.type}
                </span>
              </div>
              
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedNotification.message}
                </p>
              </div>

              {selectedNotification.link?.url && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Related Link:</p>
                  <button
                    onClick={() => {
                      if (selectedNotification.link.url.startsWith('http')) {
                        window.open(selectedNotification.link.url, '_blank');
                      } else {
                        navigate(selectedNotification.link.url);
                        setShowFullMessage(false);
                      }
                    }}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {selectedNotification.link.text || 'Visit Link'}
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                {!selectedNotification.isRead && (
                  <button
                    onClick={() => {
                      markAsRead(selectedNotification._id);
                      setShowFullMessage(false);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  onClick={() => {
                    dismissNotification(selectedNotification._id);
                    setShowFullMessage(false);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Dismiss
                </button>
              </div>
              
              <button
                onClick={() => setShowFullMessage(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
