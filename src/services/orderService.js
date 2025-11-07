import axios from 'axios';
import config from '../config/config.js';

const orderService = {
  /**
   * Create a new order.
   * @param {object} orderData - The complete order object.
   * @returns {Promise<object>} The server response.
   */
  createOrder: async (orderData) => {
    try {
      const response = await axios.post(config.API_URLS.ORDERS, orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to create order');
    }
  },

  /**
   * Fetch a single order by its ID.
   * @param {string} orderId - The ID of the order.
   * @returns {Promise<object>} The server response containing the order.
   */
  getOrderById: async (orderId) => {
    if (!orderId) {
      throw new Error('Order ID is required to fetch an order.');
    }
    try {
      const response = await axios.get(`${config.API_URLS.ORDERS}/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order by ID:', error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to fetch order');
    }
  },

  /**
   * Fetch orders for a specific user by email.
   * @param {string} email - The user's email.
   * @returns {Promise<object>} The server response containing the orders.
   */
  getOrdersByEmail: async (email) => {
    if (!email) {
      throw new Error('Email is required to fetch orders.');
    }
    try {
      const response = await axios.get(`${config.API_URLS.ORDERS}?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to fetch orders');
    }
  },

  /**
   * Request order cancellation (only COD orders with status 'processing').
   * @param {string} orderId - The ID of the order to cancel.
   * @param {string} reason - Reason for cancellation.
   * @returns {Promise<object>} The server response.
   */
  requestOrderCancellation: async (orderId, reason = 'Customer requested cancellation') => {
    if (!orderId) {
      throw new Error('Order ID is required to request order cancellation.');
    }
    try {
      const response = await axios.put(`${config.API_URLS.ORDERS}/${orderId}/request-cancellation`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error requesting order cancellation:', error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to request order cancellation');
    }
  },

  // COD specific cancellation
  requestCODCancellation: async (orderId, reason) => {
    try {
      const response = await axios.post(`${config.API_URLS.ORDERS}/${orderId}/cancel-cod`, {
        reason: reason
      });
      return response.data;
    } catch (error) {
      console.error('Error requesting COD cancellation:', error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to request COD cancellation');
    }
  },

  /**
   * Get order tracking information
   * @param {string} orderId - The ID of the order to track
   * @returns {Promise<object>} The server response containing tracking information
   */
  getOrderTracking: async (orderId) => {
    if (!orderId) {
      throw new Error('Order ID is required to track an order.');
    }
    try {
      const response = await axios.get(`${config.API_URLS.ORDERS}/${orderId}/tracking`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order tracking:', error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to fetch order tracking');
    }
  },

  /**
   * Request order return
   * @param {string} orderId - The ID of the order to return
   * @param {string} reason - Reason for return
   * @returns {Promise<object>} The server response
   */
  requestOrderReturn: async (orderId, reason) => {
    if (!orderId) {
      throw new Error('Order ID is required to request return.');
    }
    if (!reason || reason.trim().length === 0) {
      throw new Error('Return reason is required.');
    }
    try {
      const response = await axios.post(`${config.API_URLS.ORDERS}/${orderId}/return`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error requesting order return:', error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to request order return');
    }
  },

  /**
   * Generate and download invoice
   * @param {string} orderId - The ID of the order
   * @returns {Promise<object>} The server response
   */
  generateInvoice: async (orderId) => {
    if (!orderId) {
      throw new Error('Order ID is required to generate invoice.');
    }
    try {
      const response = await axios.get(`${config.API_URLS.ORDERS}/${orderId}/invoice`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error generating invoice:', error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to generate invoice');
    }
  },
};

export default orderService; 