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

const blogService = {
  // Get all published blogs
  getAllBlogs: async (params = {}) => {
    try {
      const response = await api.get('/api/blogs/public', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching blogs:', error);
      throw error;
    }
  },

  // Get blog by slug
  getBlogBySlug: async (slug) => {
    try {
      const response = await api.get(`/api/blogs/public/slug/${slug}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching blog:', error);
      throw error;
    }
  },

  // Get featured blogs
  getFeaturedBlogs: async (limit = 5) => {
    try {
      const response = await api.get('/api/blogs/public/featured', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching featured blogs:', error);
      throw error;
    }
  },

  // Get recent blogs
  getRecentBlogs: async (limit = 5) => {
    try {
      const response = await api.get('/api/blogs/public/recent', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent blogs:', error);
      throw error;
    }
  },

  // Get blog categories
  getBlogCategories: async () => {
    try {
      const response = await api.get('/api/blogs/public/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },
};

export default blogService;

