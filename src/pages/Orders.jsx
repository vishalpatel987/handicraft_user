import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import config from '../config/config.js';
import Loader from '../components/Loader';
import { orderAPI } from '../services/api';

function toIST(dateString) {
  const date = new Date(dateString);
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);
  return istDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.API_URLS.ORDERS}?email=${encodeURIComponent(user.email)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Get orders from response (backend returns { success: true, orders: [...] })
      const userOrders = response.data.orders || response.data || [];
      console.log('User Orders:', userOrders); // Debug log
      userOrders.forEach(order => {
        console.log(`Order ${order._id}:`, {
          paymentMethod: order.paymentMethod,
          orderStatus: order.orderStatus,
          canCancel: order.paymentMethod === 'cod' && order.orderStatus === 'processing'
        });
      });
      setOrders(userOrders);
    } catch (error) {
   
      const errorMessage = error.response?.data?.message || 'Failed to fetch orders. Please try again later.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-900/10 text-yellow-400 border border-yellow-400 shadow-[0_0_2px_#ca8a04]';
      case 'confirmed':
        return 'bg-blue-900/10 text-blue-400 border border-blue-400 shadow-[0_0_2px_#60a5fa]';
      case 'manufacturing':
        return 'bg-purple-900/10 text-purple-400 border border-purple-400 shadow-[0_0_2px_#c084fc]';
      case 'shipped':
        return 'bg-indigo-900/10 text-indigo-400 border border-indigo-400 shadow-[0_0_2px_#818cf8]';
      case 'delivered':
        return 'bg-green-900/10 text-green-400 border border-green-400 shadow-[0_0_2px_#4ade80]';
      case 'cancelled':
        return 'bg-red-900/10 text-red-400 border border-red-400 shadow-[0_0_2px_#f87171]';
      default:
        return 'bg-gray-900/10 text-gray-400 border border-gray-400 shadow-[0_0_2px_#9ca3af]';
    }
  };

  const handleCancelOrder = (order) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
  };
  
  const confirmCancelOrder = async () => {
    try {
      await orderAPI.cancelOrder(selectedOrder._id, cancelReason);
      setShowCancelModal(false);
      setCancelReason('');
      fetchOrders();
      toast.success('Order cancelled successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to cancel order';
      toast.error(errorMessage);
    }
  };

  const getPaymentStatusColor = (order) => {
    // Check for refund status first
    if (order.refundStatus) {
      switch (order.refundStatus) {
        case 'completed':
          return 'bg-green-900/10 text-green-400 border border-green-400 shadow-[0_0_2px_#4ade80]';
        case 'processing':
          return 'bg-blue-900/10 text-blue-400 border border-blue-400 shadow-[0_0_2px_#60a5fa]';
        case 'pending':
          return 'bg-yellow-900/10 text-yellow-400 border border-yellow-400 shadow-[0_0_2px_#ca8a04]';
        case 'failed':
          return 'bg-red-900/10 text-red-400 border border-red-400 shadow-[0_0_2px_#f87171]';
        default:
          break;
      }
    }

    switch (order.paymentStatus) {
      case 'completed':
        return 'bg-green-900/10 text-green-400 border border-green-400 shadow-[0_0_2px_#4ade80]';
      case 'pending':
        return 'bg-yellow-900/10 text-yellow-400 border border-yellow-400 shadow-[0_0_2px_#ca8a04]';
      case 'pending_upfront':
        return 'bg-blue-900/10 text-blue-400 border border-blue-400 shadow-[0_0_2px_#60a5fa]';
      case 'failed':
        return 'bg-red-900/10 text-red-400 border border-red-400 shadow-[0_0_2px_#f87171]';
      default:
        return 'bg-gray-900/10 text-gray-400 border border-gray-400 shadow-[0_0_2px_#9ca3af]';
    }
  };

  const getPaymentStatusText = (order) => {
    // Check for refund status first
    if (order.refundStatus) {
      switch (order.refundStatus) {
        case 'completed':
          return 'Refund Received';
        case 'processing':
          return 'Refund Processing';
        case 'pending':
          return 'Refund Pending';
        case 'failed':
          return 'Refund Failed';
        default:
          break;
      }
    }

    if (order.paymentMethod === 'cod') {
      switch (order.paymentStatus) {
        case 'completed':
          return 'Payment Received';
        case 'pending':
          return 'Payment Pending';
        case 'pending_upfront':
          return 'Upfront Paid';
        case 'failed':
          return 'Payment Failed';
        default:
          return 'Payment Pending';
      }
    } else {
      switch (order.paymentStatus) {
        case 'completed':
          return 'Payment Successful';
        case 'pending':
          return 'Payment Pending';
        case 'failed':
          return 'Payment Failed';
        default:
          return 'Payment Pending';
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center">
            <Loader size="large" text="Loading orders..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-red-400">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 relative inline-block group">
          <span className="relative z-10">Your Orders</span>
          <span className="absolute inset-0 bg-neon-pink/20 blur-lg group-hover:bg-neon-pink/30 transition-colors duration-300"></span>
        </h1>
        
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No orders found</p>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <div key={order._id} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-pink to-neon-blue opacity-30 blur group-hover:opacity-50 transition duration-300"></div>
                <div className="relative bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-700">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-semibold text-white group-hover:text-neon-pink transition-colors duration-300">
                          Order #{order._id.slice(-6).toUpperCase()}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                          Placed on {toIST(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                          {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order)}`}>
                          {getPaymentStatusText(order)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-white">Items</h3>
                      <div className="mt-4 space-y-4">
                        {order.items.map((item, index) => (
                          <div key={index} className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium text-white">{item.text}</p>
                                <p className="text-sm text-gray-400">
                                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)} • {item.size} • {item.usage}
                                </p>
                                {item.addOns.length > 0 && (
                                  <p className="text-sm text-gray-400">
                                    Add-ons: {item.addOns.join(', ')}
                                  </p>
                                )}
                              </div>
                              <p className="font-medium text-neon-pink">₹{item.price.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 border-t border-gray-700 pt-6">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-white">Shipping Details</h3>
                          <div className="mt-2 text-sm text-gray-400">
                            <p>{order.customerName}</p>
                            <p>{order.address.street}</p>
                            <p>{order.address.city}, {order.address.state} {order.address.pincode}</p>
                            <p>{order.address.country}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Total Amount</p>
                          <p className="text-2xl font-bold text-neon-pink group-hover:text-neon-blue transition-colors duration-300">
                            ₹{order.totalAmount.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            {order.paymentMethod.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Cancel Button - For processing orders (both COD and Online) */}
                      {(() => {
                        const canCancel = order.orderStatus === 'processing' && 
                                        !order.cancellationRequested && !order.cancellationStatus;
                        
                        // Debug logging
                        console.log(`User Orders - Order ${order._id}:`, {
                          orderStatus: order.orderStatus,
                          paymentMethod: order.paymentMethod,
                          cancellationRequested: order.cancellationRequested,
                          cancellationStatus: order.cancellationStatus,
                          canCancel: canCancel
                        });
                        
                        return canCancel;
                      })() && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <button
                            onClick={() => handleCancelOrder(order)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                          >
                            Cancel Order
                          </button>
                          <p className="text-xs text-gray-400 mt-2 text-center">
                            {order.paymentMethod === 'cod' 
                              ? 'Cancel order while processing' 
                              : 'Cancel order (refund will be processed)'}
                          </p>
                        </div>
                      )}

                      {/* Cancellation and Refund Status */}
                      {order.cancellationRequested && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          {order.cancellationStatus === 'pending' && (
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                              <p className="text-sm font-medium text-yellow-400">⏳ Cancellation Request Pending</p>
                              <p className="text-xs text-yellow-300 mt-1">Admin will review your request</p>
                            </div>
                          )}
                          
                          {order.cancellationStatus === 'approved' && (
                            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                              <p className="text-sm font-medium text-red-400">✅ Order Cancelled</p>
                              {order.paymentMethod !== 'cod' && (
                                <div className="mt-2">
                                  {order.refundStatus === 'pending' && (
                                    <p className="text-xs text-yellow-300">
                                      💳 Refund Pending - Admin will process refund
                                    </p>
                                  )}
                                  {order.refundStatus === 'processing' && (
                                    <p className="text-xs text-blue-300">
                                      💳 Refund Processing - Money will be credited soon
                                    </p>
                                  )}
                                  {order.refundStatus === 'completed' && (
                                    <p className="text-xs text-green-300">
                                      ✅ Refund Completed - Money credited to your account
                                    </p>
                                  )}
                                  {order.refundStatus === 'failed' && (
                                    <p className="text-xs text-red-300">
                                      ❌ Refund Failed - Please contact support
                                    </p>
                                  )}
                                  {!order.refundStatus && (
                                    <p className="text-xs text-green-300">
                                      💳 Refund will be processed after admin approval
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {order.cancellationStatus === 'rejected' && (
                            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                              <p className="text-sm font-medium text-red-400">❌ Cancellation Request Rejected</p>
                              <p className="text-xs text-red-300 mt-1">Your cancellation request was rejected</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Cancel Order</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-neon-pink focus:border-transparent"
                rows="3"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Keep Order
              </button>
              <button
                onClick={confirmCancelOrder}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}