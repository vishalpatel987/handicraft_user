import axios from 'axios';
import config from '../config/config';

const API_BASE_URL = config.API_BASE_URL;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const wishlistService = {
  // Get user's wishlist
  getWishlist: async (email) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/wishlist`, {
        params: { email },
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      throw error;
    }
  },

  // Add product to wishlist
  addToWishlist: async (email, productId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/wishlist/add`, {
        email,
        productId
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  },

  // Remove product from wishlist
  removeFromWishlist: async (email, productId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/wishlist/remove`, {
        email,
        productId
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  },

  // Clear entire wishlist
  clearWishlist: async (email) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/wishlist/clear`, {
        email
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      throw error;
    }
  },

  // Check if product is in wishlist
  checkWishlistStatus: async (email, productId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/wishlist/check`, {
        params: { email, productId },
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error checking wishlist status:', error);
      throw error;
    }
  }
};

export default wishlistService;

