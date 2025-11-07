import axios from 'axios';
import config from '../config/config.js';

// Generate unique session ID
const getSessionId = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  let sessionId;
  
  if (user && user.id) {
    // For registered users, use user ID in session
    sessionId = 'user_session_' + user.id + '_' + Date.now();
  } else {
    // For anonymous users, use browser session
    sessionId = localStorage.getItem('anonymous_session_id');
    if (!sessionId) {
      sessionId = 'anonymous_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('anonymous_session_id', sessionId);
    }
  }
  
  return sessionId;
};

// Track user activity
const trackActivity = async (activityData) => {
  try {
    const sessionId = getSessionId();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    const payload = {
      sessionId,
      userId: user?.id || null,
      userType: user ? 'registered' : 'anonymous',
      email: user?.email || null,
      ...activityData
    };

    console.log('📊 Tracking activity:', activityData.activityType);
    await axios.post(`${config.API_BASE_URL}/api/user-activity/track`, payload);
    console.log('✅ Activity tracked successfully');
  } catch (error) {
    console.error('❌ Error tracking activity:', error.message);
    // Don't throw error to avoid breaking user experience
  }
};

// Track page view
export const trackPageView = (page) => {
  trackActivity({
    activityType: 'page_view',
    page,
    timestamp: new Date()
  });
};

// Track category visit
export const trackCategoryVisit = (categoryId, subCategoryId = null) => {
  trackActivity({
    activityType: 'category_visit',
    category: categoryId,
    subCategory: subCategoryId,
    timestamp: new Date()
  });
};

// Track product view
export const trackProductView = (productId, productName) => {
  trackActivity({
    activityType: 'product_view',
    productId,
    productName,
    timestamp: new Date()
  });
};

// Track add to cart
export const trackAddToCart = (productId, productName, categoryId = null) => {
  trackActivity({
    activityType: 'add_to_cart',
    productId,
    productName,
    category: categoryId,
    timestamp: new Date()
  });
};


// Track login
export const trackLogin = (userId, email) => {
  trackActivity({
    activityType: 'login',
    userId,
    email,
    timestamp: new Date()
  });
};

// Track registration
export const trackRegistration = (userId, email) => {
  trackActivity({
    activityType: 'register',
    userId,
    email,
    timestamp: new Date()
  });
};

export default {
  trackPageView,
  trackCategoryVisit,
  trackProductView,
  trackAddToCart,
  trackLogin,
  trackRegistration
};
