import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import announcementService from '../../services/announcementService';

const AnnouncementBanner = ({ location = 'home' }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState([]);

  useEffect(() => {
    fetchAnnouncements();
    // Load dismissed announcements from localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
    setDismissedAnnouncements(dismissed);
  }, [location]);

  const fetchAnnouncements = async () => {
    try {
      const response = await announcementService.getActiveAnnouncements(location);
      setAnnouncements(response.announcements || []);
      
      // Increment views for all announcements
      response.announcements?.forEach(ann => {
        announcementService.incrementViews(ann._id);
      });
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const handleDismiss = (announcementId) => {
    const newDismissed = [...dismissedAnnouncements, announcementId];
    setDismissedAnnouncements(newDismissed);
    localStorage.setItem('dismissed_announcements', JSON.stringify(newDismissed));
  };

  const handleLinkClick = (announcement) => {
    if (announcement._id) {
      announcementService.incrementClicks(announcement._id);
    }
  };

  const visibleAnnouncements = announcements.filter(
    ann => !dismissedAnnouncements.includes(ann._id)
  );

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="relative z-40">
      <AnimatePresence>
        {visibleAnnouncements.map((announcement, index) => (
          <motion.div
            key={announcement._id}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="relative"
            style={{
              backgroundColor: announcement.backgroundColor,
              color: announcement.textColor,
            }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex items-center justify-center gap-3">
                  <div className="flex-1 text-center md:text-left">
                    <p className="font-semibold">{announcement.title}</p>
                    <p className="text-sm opacity-90">{announcement.content}</p>
                  </div>
                  {announcement.link?.url && (
                    <a
                      href={announcement.link.url}
                      onClick={() => handleLinkClick(announcement)}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors font-medium whitespace-nowrap"
                    >
                      {announcement.link.text}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                {announcement.isDismissible && (
                  <button
                    onClick={() => handleDismiss(announcement._id)}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label="Dismiss announcement"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementBanner;

