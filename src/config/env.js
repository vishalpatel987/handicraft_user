/**
 * Environment configuration
 * This file loads environment variables from .env files and provides
 * type-safe access to them throughout the application.
 */

const env = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5175',
  
  // Feature Flags
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_LOGGING: import.meta.env.VITE_ENABLE_LOGGING === 'true',
  
  // Google OAuth
  GOOGLE: {
    CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '487489664945-gubiolvb67gemfi384h9tkd9307l6njj.apps.googleusercontent.com',
  },
  
  // Razorpay Payment Gateway
  RAZORPAY: {
    KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_8sYbzHWidwe5Zw',
    KEY_SECRET: import.meta.env.VITE_RAZORPAY_KEY_SECRET || 'GkxKRQ2B0U63BKBoayuugS3D',
    CURRENCY: import.meta.env.VITE_RAZORPAY_CURRENCY || 'INR',
    THEME: import.meta.env.VITE_RAZORPAY_THEME || 'color',
    ENV: import.meta.env.VITE_RAZORPAY_ENV || 'sandbox',
  },
  
  // Frontend and Backend URLs
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173',
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5175',
  
  // Image CDN
  IMAGE_CDN_URL: import.meta.env.VITE_IMAGE_CDN_URL || 'http://localhost:5175',
  
  // WebSocket Configuration
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5175',
  SOCKET_RECONNECT_ATTEMPTS: parseInt(import.meta.env.VITE_SOCKET_RECONNECT_ATTEMPTS) || 5,
  SOCKET_RECONNECT_DELAY: parseInt(import.meta.env.VITE_SOCKET_RECONNECT_DELAY) || 1000,
  SOCKET_TIMEOUT: parseInt(import.meta.env.VITE_SOCKET_TIMEOUT) || 30000,
  
  // Support System
  SUPPORT_EMAIL: import.meta.env.VITE_SUPPORT_EMAIL || 'support@rikocraft.com',
  CHAT_ENABLED: import.meta.env.VITE_CHAT_ENABLED === 'true',
  NOTIFICATION_ENABLED: import.meta.env.VITE_NOTIFICATION_ENABLED === 'true',
  
  // MSG91 Configuration (for SMS)
  MSG91: {
    WIDGET_ID: import.meta.env.VITE_MSG91_WIDGET_ID || '356765707a68343736313035',
    TOKEN_AUTH: import.meta.env.VITE_MSG91_TOKEN_AUTH || '458779TNIVxOl3qDwI6866bc33P1',
  },
  
  // App Configuration
  APP: {
    NAME: import.meta.env.VITE_APP_NAME || 'RIKO CRAFT',
    DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION || 'Your one-stop shop for unique handcrafted items',
    CONTACT_EMAIL: import.meta.env.VITE_CONTACT_EMAIL || 'support@rikocraft.com',
    SUPPORT_PHONE: import.meta.env.VITE_SUPPORT_PHONE || '+91 98765 43210',
  },
  
  // Social Media Links
  SOCIAL: {
    FACEBOOK: import.meta.env.VITE_FACEBOOK_URL || '',
    INSTAGRAM: import.meta.env.VITE_INSTAGRAM_URL || '',
    TWITTER: import.meta.env.VITE_TWITTER_URL || '',
  },
  
  // Security
  SECURITY: {
    JWT_EXPIRY: import.meta.env.VITE_JWT_EXPIRY || '7d',
    ENABLE_RECAPTCHA: import.meta.env.VITE_ENABLE_RECAPTCHA === 'true',
    RECAPTCHA_SITE_KEY: import.meta.env.VITE_RECAPTCHA_SITE_KEY || '',
  },
  
  // Cache Configuration
  CACHE: {
    DURATION: parseInt(import.meta.env.VITE_CACHE_DURATION || '3600', 10),
    ENABLE_SERVICE_WORKER: import.meta.env.VITE_ENABLE_SERVICE_WORKER === 'true',
  },
  
  // Environment Detection
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  IS_TESTING: import.meta.env.MODE === 'test',
  
  // Performance Monitoring
  PERFORMANCE: {
    ENABLE_METRICS: import.meta.env.VITE_ENABLE_PERFORMANCE_METRICS === 'true',
    SAMPLE_RATE: parseFloat(import.meta.env.VITE_PERFORMANCE_SAMPLE_RATE || '0.1'),
  },
  
  // Error Reporting
  ERROR_REPORTING: {
    ENABLE_SENTRY: import.meta.env.VITE_ENABLE_SENTRY === 'true',
    SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN || '',
    SENTRY_ENVIRONMENT: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
  },
  
  // CORS Configuration
  CORS: {
    WITH_CREDENTIALS: true,
    HEADERS: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  },
  
  // Utility Functions
  fixImageUrl: (imagePath) => {
    if (!imagePath) return '';
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Remove any leading slashes and clean the path
    const cleanPath = imagePath.replace(/^\/+/, '').replace(/\/+/g, '/');
    
    // If it's a path to a backend data file
    if (cleanPath.includes('Rikocraft.com') || !cleanPath.includes('/')) {
      // Always use /pawnbackend/data/ prefix for backend files
      const basePath = cleanPath.startsWith('pawnbackend/data/') ? '' : 'pawnbackend/data/';
      return `${env.API_BASE_URL}/${basePath}${cleanPath}`;
    }
    
    // By default, assume it's a frontend public asset
    return `/${cleanPath}`;
  },
  
  // Development helpers
  get isDev() {
    return this.IS_DEVELOPMENT;
  },
  
  get isProd() {
    return this.IS_PRODUCTION;
  },
  
  // API URL builder
  getApiUrl: (endpoint) => {
    return `${env.API_BASE_URL}${endpoint}`;
  },
  
  // Log helper for development
  log: (...args) => {
    if (env.IS_DEVELOPMENT && env.ENABLE_LOGGING) {
      console.log(...args);
    }
  },
  
  // Error helper for development
  logError: (...args) => {
    if (env.IS_DEVELOPMENT && env.ENABLE_LOGGING) {
      console.error(...args);
    }
  },
};



export default env; 