import axios from 'axios';
import config from '../config/config';
import orderService from './orderService';

const API_BASE_URL = config.API_BASE_URL;

const paymentService = {
  // Initiate Razorpay payment (returns { success, orderId, keyId, amount, ... })
  initiateRazorpayPayment: async (orderData) => {
    try {
      console.log('PaymentService - Initiating Razorpay payment with data:', orderData);
      
      // Validate required fields
      if (!orderData.amount || !orderData.customerName || !orderData.email || !orderData.phone) {
        throw new Error('Missing required fields: amount, customerName, email, phone');
      }

      // Ensure amount is a valid number
      const validAmount = (typeof orderData.amount === 'number' && !isNaN(orderData.amount)) ? orderData.amount : 0;
      if (validAmount <= 0) {
        throw new Error('Invalid payment amount. Amount must be greater than 0.');
      }

      // Send all fields as required by backend controller
      const response = await axios.post(`${API_BASE_URL}/api/payment/razorpay`, {
        amount: validAmount,
        customerName: orderData.customerName,
        email: orderData.email,
        phone: orderData.phone,
        address: orderData.address,
        city: orderData.city,
        state: orderData.state,
        pincode: orderData.pincode,
        country: orderData.country,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        shippingCost: orderData.shippingCost,
        codExtraCharge: orderData.codExtraCharge,
        finalTotal: orderData.finalTotal,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentStatus,
        upfrontAmount: orderData.upfrontAmount,
        remainingAmount: orderData.remainingAmount,
        sellerToken: orderData.sellerToken,
        couponCode: orderData.couponCode
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('PaymentService - Razorpay payment initiated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('PaymentService - Razorpay payment initiation error:', error);
      
      let errorMessage = 'Failed to initiate Razorpay payment';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Payment gateway timeout. Please try again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Payment gateway error. Please try again later.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid payment data. Please check your information.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },



  // Handle Razorpay callback verification
  async verifyRazorpayCallback(callbackData) {
    try {
      console.log('PaymentService - Verifying Razorpay callback:', callbackData);
      
      const response = await axios.post(`${API_BASE_URL}/api/payment/razorpay/callback`, callbackData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('PaymentService - Callback verification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('PaymentService - Callback verification error:', error);
      throw new Error('Failed to verify payment callback');
    }
  },


  // Process refund through Razorpay
  async processRazorpayRefund(refundData) {
    try {
      console.log('PaymentService - Processing Razorpay refund:', refundData);
      
      const response = await axios.post(`${API_BASE_URL}/api/payment/razorpay/refund`, refundData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('PaymentService - Razorpay refund response:', response.data);
      return response.data;
    } catch (error) {
      console.error('PaymentService - Razorpay refund error:', error);
      
      let errorMessage = 'Failed to process refund';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Refund request timeout. Please try again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Refund service not found. Please contact support.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Refund gateway error. Please try again later.';
      }
      
      throw new Error(errorMessage);
    }
  },

  // Get Razorpay payment status
  async getRazorpayStatus(orderId) {
    try {
      console.log('PaymentService - Getting Razorpay status for order:', orderId);
      
      const response = await axios.get(`${API_BASE_URL}/api/payment/razorpay/status/${orderId}`, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('PaymentService - Razorpay status response:', response.data);
      return response.data;
    } catch (error) {
      console.error('PaymentService - Razorpay status error:', error);
      
      let errorMessage = 'Failed to get payment status';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Status check timeout. Please try again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Payment not found. Please contact support.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Status check error. Please try again later.';
      }
      
      throw new Error(errorMessage);
    }
  },

  // Check Razorpay refund status
  async checkRazorpayRefundStatus(refundId) {
    try {
      console.log('PaymentService - Checking Razorpay refund status:', refundId);
      
      const response = await axios.get(`${API_BASE_URL}/api/payment/razorpay/refund/${refundId}/status`, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('PaymentService - Razorpay refund status response:', response.data);
      return response.data;
    } catch (error) {
      console.error('PaymentService - Razorpay refund status check error:', error);
      
      let errorMessage = 'Failed to check refund status';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Refund status check timeout. Please try again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Refund not found. Please contact support.';
      }
      
      throw new Error(errorMessage);
    }
  },


  // Create order after successful payment
  async createOrderAfterPayment(orderData, paymentStatus = 'completed') {
    try {
      console.log('PaymentService - Creating order after payment with data:', orderData);
      
      // Ensure orderData is not null or undefined
      if (!orderData) {
        throw new Error('Order data is required to create order');
      }
      
      const orderPayload = {
        customerName: orderData.customerName,
        email: orderData.email,
        phone: orderData.phone,
        address: orderData.address,
        city: orderData.city,
        state: orderData.state,
        pincode: orderData.pincode,
        country: orderData.country,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentMethod === 'cod' ? 'partial' : paymentStatus,
        upfrontAmount: orderData.upfrontAmount || 0,
        remainingAmount: orderData.remainingAmount || 0,
        sellerToken: orderData.sellerToken,
        razorpayOrderId: orderData.razorpayOrderId || orderData.orderId,
        couponCode: orderData.couponCode
      };

      console.log('PaymentService - Order payload:', orderPayload);
      const response = await orderService.createOrder(orderPayload);
      console.log('PaymentService - Order created successfully:', response);
      return response;
    } catch (error) {
      console.error('PaymentService - Order creation error:', error);
      throw new Error('Failed to create order after payment: ' + (error.message || 'Unknown error'));
    }
  },

  // Complete payment flow - verify payment and create order
  async completePaymentFlow(orderId, orderData) {
    try {
      console.log('PaymentService - Completing payment flow for order:', orderId);
      
      // First verify payment status with Razorpay
      const paymentStatus = await this.verifyRazorpayCallback({ razorpay_order_id: orderId });
      
      console.log('PaymentService - Payment status response:', paymentStatus);
      
      if (paymentStatus.success && paymentStatus.data?.state === 'COMPLETED') {
        // Payment is successful, create order
        console.log('PaymentService - Payment completed, creating order...');
        try {
          const orderResult = await this.createOrderAfterPayment(orderData, 'completed');
          return {
            success: true,
            code: 'PAYMENT_SUCCESS',
            data: {
              state: 'COMPLETED',
              message: 'Payment completed successfully'
            },
            paymentStatus,
            order: orderResult
          };
        } catch (orderError) {
          console.error('PaymentService - Order creation failed after successful payment:', orderError);
          return {
            success: false,
            code: 'ORDER_CREATION_FAILED',
            data: {
              state: 'COMPLETED',
              message: 'Payment successful but order creation failed'
            },
            paymentStatus,
            message: 'Payment was successful but we could not create your order. Please contact support with your transaction ID.'
          };
        }
      } else if (paymentStatus.success && paymentStatus.data?.state === 'PENDING') {
        // Payment is pending, create order with pending status
        console.log('PaymentService - Payment pending, creating order with pending status...');
        try {
          const orderResult = await this.createOrderAfterPayment(orderData, 'pending');
          return {
            success: true,
            code: 'PAYMENT_PENDING',
            data: {
              state: 'PENDING',
              message: 'Payment is pending. Please check your orders after a few minutes.'
            },
            paymentStatus,
            order: orderResult
          };
        } catch (orderError) {
          console.error('PaymentService - Order creation failed for pending payment:', orderError);
          return {
            success: false,
            code: 'ORDER_CREATION_FAILED',
            data: {
              state: 'PENDING',
              message: 'Payment is pending but order creation failed'
            },
            paymentStatus,
            message: 'Payment is being processed but we could not create your order. Please contact support.'
          };
        }
      } else if (paymentStatus.success && paymentStatus.data?.state === 'FAILED') {
        // Payment failed
        console.log('PaymentService - Payment failed:', paymentStatus.data);
        return {
          success: false,
          code: 'PAYMENT_FAILED',
          data: {
            state: 'FAILED',
            message: 'Payment failed: ' + (paymentStatus.data?.errorCode || 'Unknown error')
          },
          paymentStatus,
          message: 'Payment failed: ' + (paymentStatus.data?.errorCode || 'Unknown error')
        };
      } else {
        // Payment verification failed or unknown state
        console.log('PaymentService - Payment verification failed or unknown state:', paymentStatus);
        return {
          success: false,
          code: 'VERIFICATION_FAILED',
          data: {
            state: 'UNKNOWN',
            message: 'Payment verification failed or payment status is unknown'
          },
          paymentStatus,
          message: 'Payment verification failed or payment status is unknown'
        };
      }
    } catch (error) {
      console.error('PaymentService - Payment flow completion error:', error);
      throw error;
    }
  }
};

export default paymentService; 