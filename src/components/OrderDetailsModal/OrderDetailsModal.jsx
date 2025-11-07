import { useEffect, useState } from 'react';
import { orderAPI } from '../../services/api';
import Loader from '../Loader/Loader';
import { motion, AnimatePresence } from 'framer-motion';

const OrderDetailsModal = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await orderAPI.getOrderById(orderId);
        setOrder(response.data.order);
      } catch (err) {
        setError('Failed to load order details. Please try again later.');
        console.error('Error fetching order details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const statusColors = {
      processing: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      manufacturing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: 40 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white/70 backdrop-blur-lg border border-white/30"
        >
          <div className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-3xl z-10">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Order Details</h2>
          <button
            onClick={onClose}
              className="group p-2 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500"
              aria-label="Close order details"
          >
              <svg className="w-6 h-6 text-gray-500 group-hover:text-pink-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

          <div className="p-6 sm:p-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader />
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">{error}</div>
          ) : order ? (
              <div className="space-y-8">
              {/* Order Status and Date */}
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <p className="text-xs text-gray-500">Order ID</p>
                    <p className="font-mono text-sm text-pink-700">{order._id}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500">Order Date</p>
                    <p className="font-medium text-gray-800">{formatDate(order.createdAt)}</p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-4">
                  <span className={`px-4 py-1 rounded-full text-sm font-semibold shadow-sm border ${getStatusColor(order.orderStatus)} transition-all`}> 
                    <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle bg-current opacity-60"></span>
                  {order.orderStatus?.charAt(0).toUpperCase() + order.orderStatus?.slice(1)}
                </span>
                  <span className={`px-4 py-1 rounded-full text-sm font-semibold shadow-sm border ${getPaymentStatusColor(order.paymentStatus)} transition-all`}>
                    <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle bg-current opacity-60"></span>
                  Payment: {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
                </span>
              </div>

              {/* Customer Details */}
              <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">Customer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="font-medium text-gray-800">{order.customerName}</p>
                  </div>
                  <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-gray-800">{order.email}</p>
                  </div>
                  <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-medium text-gray-800">{order.phone}</p>
                  </div>
                  <div>
                      <p className="text-xs text-gray-500">Payment Method</p>
                      <p className="font-medium text-gray-800">{order.paymentMethod}</p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">Shipping Address</h3>
                  <p className="text-gray-700 text-base">
                  {order.address.street}<br />
                  {order.address.city}, {order.address.state} {order.address.pincode}<br />
                  {order.address.country}
                </p>
              </div>

              {/* Order Items */}
              <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-4 text-lg">Order Items</h3>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0 gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {item.image && (
                            <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-xl border border-gray-200 shadow-sm" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                          </div>
                      </div>
                        <p className="font-semibold text-lg text-pink-700 whitespace-nowrap">₹{item.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                    <p className="font-semibold text-gray-900 text-lg">Total Amount</p>
                    <p className="text-2xl font-bold text-pink-700">₹{order.totalAmount.toFixed(2)}</p>
                </div>
              </div>

              {/* COD Payment Breakdown */}
              {order.paymentMethod === 'cod' && order.upfrontAmount > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg">COD Payment Breakdown</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-600 font-medium">Upfront Paid:</p>
                        <p className="text-lg font-bold text-blue-800">₹{order.upfrontAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-blue-600 font-medium">On Delivery:</p>
                        <p className="text-lg font-bold text-blue-800">₹{(order.totalAmount - order.upfrontAmount).toFixed(2)}</p>
                      </div>
                    </div>
                    
                    {/* Refund Information for COD Orders */}
                    {order.cancellationStatus === 'approved' && order.refundStatus && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <h4 className="text-sm font-semibold text-blue-800 mb-3">Refund Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-600 font-medium">Refund Amount:</span>
                            <span className="font-bold text-blue-800">₹{order.refundAmount?.toFixed(2) || order.upfrontAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-600 font-medium">Refund Status:</span>
                            <span className={`font-bold ${
                              order.refundStatus === 'completed' ? 'text-green-600' :
                              order.refundStatus === 'processing' ? 'text-blue-600' :
                              order.refundStatus === 'pending' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {order.refundStatus === 'completed' ? '✅ Completed' :
                               order.refundStatus === 'processing' ? '🔄 Processing' :
                               order.refundStatus === 'pending' ? '⏳ Pending' :
                               '❌ Failed'}
                            </span>
                          </div>
                          {order.refundCompletedAt && (
                            <div className="flex justify-between">
                              <span className="text-blue-600 font-medium">Completed On:</span>
                              <span className="font-medium text-blue-800">{formatDate(order.refundCompletedAt)}</span>
                            </div>
                          )}
                          {order.refundTransactionId && (
                            <div className="flex justify-between">
                              <span className="text-blue-600 font-medium">Refund ID:</span>
                              <span className="font-mono text-xs text-blue-800">{order.refundTransactionId}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cancellation Information */}
              {order.cancellationStatus && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg">Cancellation Information</h3>
                  <div className={`p-4 rounded-lg border ${
                    order.cancellationStatus === 'approved' ? 'bg-red-50 border-red-200' :
                    order.cancellationStatus === 'rejected' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Status:</span>
                        <span className={`font-bold ${
                          order.cancellationStatus === 'approved' ? 'text-red-600' :
                          order.cancellationStatus === 'rejected' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`}>
                          {order.cancellationStatus === 'approved' ? '✅ Approved' :
                           order.cancellationStatus === 'rejected' ? '❌ Rejected' :
                           '⏳ Pending'}
                        </span>
                      </div>
                      {order.cancellationReason && (
                        <div className="flex justify-between">
                          <span className="font-medium">Reason:</span>
                          <span className="text-gray-700">{order.cancellationReason}</span>
                        </div>
                      )}
                      {order.cancelledAt && (
                        <div className="flex justify-between">
                          <span className="font-medium">Cancelled On:</span>
                          <span className="text-gray-700">{formatDate(order.cancelledAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No order details found.</div>
          )}
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OrderDetailsModal; 