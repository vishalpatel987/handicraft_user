import axios from 'axios';
import config from '../config/config.js';

// Create axios instance with base URL from config
const api = axios.create({
  baseURL: config.API_BASE_URL + '/api',
  headers: config.CORS.HEADERS,
  withCredentials: config.CORS.WITH_CREDENTIALS,
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding token to request:', token.substring(0, 20) + '...');
    } else {
      console.log('No token found in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  updateProfile: (data) => api.put('/auth/update-profile', data),
};

// Order API endpoints
export const orderAPI = {
  getOrdersByEmail: (email) => api.get(`/orders?email=${email}`),
  getOrderById: (orderId) => api.get(`/orders/${orderId}`),
  createOrder: (orderData) => api.post('/orders', orderData),
  cancelOrder: async (orderId, reason) => {
    return api.put(`/orders/${orderId}/cancel`, { reason });
  }
};

// Coupon endpoints
const validateCoupon = (data) => {
  return axios.post(`${config.API_BASE_URL}/api/coupons/validate`, data);
};

const applyCoupon = (data) => {
  return axios.post(`${config.API_BASE_URL}/api/coupons/apply`, data);
};

// Settings API endpoints
export const settingsAPI = {
  getCodUpfrontAmount: () => api.get('/settings/cod-upfront-amount'),
};

// Notifications API endpoints
export const notificationAPI = {
  getNotifications: () => api.get('/announcements/public'),
};

// Support API endpoints
export const supportAPI = {
  // Support Queries
  submitSupportQuery: (queryData) => api.post('/support/queries', queryData),
  getSupportQueries: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/support/queries${queryString ? '?' + queryString : ''}`);
  },
  getSupportQueryById: (id) => api.get(`/support/queries/${id}`),
  addQueryResponse: (id, responseData) => api.post(`/support/queries/${id}/response`, responseData),

  // Support Tickets
  submitSupportTicket: (ticketData) => api.post('/support/tickets', ticketData),
  getSupportTickets: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/support/tickets${queryString ? '?' + queryString : ''}`);
  },
  getSupportTicketById: (id) => api.get(`/support/tickets/${id}`),
  addTicketMessage: (id, messageData) => api.post(`/support/tickets/${id}/message`, messageData),

  // Chat Rooms
  createChatRoom: (roomData) => api.post('/support/chat/rooms', roomData),
  getChatRooms: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/support/chat/rooms${queryString ? '?' + queryString : ''}`);
  },
  getChatRoomById: (id) => api.get(`/support/chat/rooms/${id}`),
  addChatMessage: (roomId, messageData) => api.post(`/support/chat/rooms/${roomId}/message`, messageData),
  joinChatRoom: (roomId, participantData) => api.post(`/support/chat/rooms/${roomId}/join`, participantData),
};

// Default export for general API usage
export default api; 