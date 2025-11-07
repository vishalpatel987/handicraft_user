import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  UserCircleIcon, 
  PencilSquareIcon, 
  ArrowLeftOnRectangleIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ShoppingCartIcon, 
  ClockIcon, 
  TrashIcon, 
  PlusIcon, 
  MinusIcon,
  CogIcon,
  ShieldCheckIcon,
  HeartIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CreditCardIcon,
  TruckIcon,
  GiftIcon,
  ChartBarIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import orderService from '../services/orderService';
import config from '../config/config.js';
import OrderDetailsModal from '../components/OrderDetailsModal/OrderDetailsModal';
import CODCancellationModal from '../components/CODCancellationModal';
import OrderTracking from '../components/OrderTracking/OrderTracking';

// Helper to get tab from URL
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const Account = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState(() => {
    const initialTab = query.get('tab') || 'overview';
    return initialTab;
  });
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCODCancelModal, setShowCODCancelModal] = useState(false);
  const [codOrderToCancel, setCodOrderToCancel] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const { cartItems, removeFromCart, updateQuantity, clearCart, getTotalPrice, loading: cartLoading, getItemImage } = useCart();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { user, logout, updateProfile, isAuthenticated } = useAuth();

  // Function to handle tab changes and update URL
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Update URL without reloading the page
    const newUrl = `/account?tab=${tabId}`;
    navigate(newUrl, { replace: true });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      setLoading(false);
      toast.success(`Welcome back, ${user?.name}!`);
    }
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setFormData(prev => ({
      ...prev,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
    }));
  }, [user, navigate]);

  useEffect(() => {
    if (user?.email) {
      fetchOrders();
    }
    // eslint-disable-next-line
  }, [user?.email]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  useEffect(() => {
    const tab = query.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.orderStatus === filter));
    }
  }, [filter, orders]);

  const fetchOrders = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const data = await orderService.getOrdersByEmail(user.email);
      if (data.success) {
        const sortedOrders = data.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedOrders);
        setFilteredOrders(sortedOrders);
      } else {
        throw new Error(data.message || 'No success field in response');
      }
    } catch (error) {
      let errorMsg = error?.message || 'Failed to fetch orders';
      if (error?.response?.data?.message) errorMsg = error.response.data.message;
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await updateQuantity(productId, newQuantity);
      toast.success('Cart updated successfully');
    } catch (error) {
      toast.error('Failed to update cart');
    }
  };

  const handleRemoveFromCart = async (productId) => {
    try {
      await removeFromCart(productId);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item from cart');
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      toast.success('Cart cleared successfully');
    } catch (error) {
      toast.error('Failed to clear cart');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'manufacturing':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'shipped':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'delivered':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return <ClockIcon className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'manufacturing':
        return <CogIcon className="h-4 w-4" />;
      case 'shipped':
        return <TruckIcon className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (formData.newPassword && formData.newPassword !== formData.confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      await updateProfile(updateData);
      
      // Check if this was a Google user completing their profile
      const isGoogleUser = user?.googleId;
      const hasPhoneAndAddress = formData.phone?.trim() && formData.address?.trim();
      
      if (isGoogleUser && hasPhoneAndAddress) {
        setMessage('Profile completed successfully! Welcome to Riko Craft!');
      } else {
        setMessage('Profile updated successfully!');
      }
      
      setIsEditing(false);
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }));
    } catch (error) {
      // Handle token expiry specifically
      if (error.message === 'Session expired. Please login again.') {
        setError('Your session has expired. Please login again.');
        // The AuthContext will handle the redirect
        return;
      }
      setError(error.message || 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCancelOrderClick = (order) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
    setCancellationReason('');
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    
    if (!cancellationReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    setCancellingOrderId(orderToCancel._id);
    try {
      const response = await orderService.requestOrderCancellation(orderToCancel._id, cancellationReason);
      if (response.success) {
        toast.success('Cancellation request submitted successfully! Admin will review and confirm within 24 hours.');
        setShowCancelModal(false);
        setOrderToCancel(null);
        setCancellationReason('');
        fetchOrders(); // Refresh orders
      } else {
        toast.error(response.message || 'Failed to submit cancellation request');
      }
    } catch (error) {
      const errorMsg = error?.message || 'Failed to submit cancellation request';
      toast.error(errorMsg);
    } finally {
      setCancellingOrderId(null);
    }
  };

  const canCancelOrder = (order) => {
    // Only allow cancellation for processing orders
    const allowedStatuses = ['processing'];
    
    // Check if order has cancellation fields, if not, assume they are false/undefined
    const cancellationRequested = order.cancellationRequested || false;
    const cancellationStatus = order.cancellationStatus || 'none';
    
    const canCancel = allowedStatuses.includes(order.orderStatus) && 
           !cancellationRequested &&
           (cancellationStatus === 'none' || !cancellationStatus);
    
    // Debug logging
    console.log(`Order ${order._id} - Payment: ${order.paymentMethod}, Status: ${order.orderStatus}, Can Cancel: ${canCancel}`, {
      orderStatus: order.orderStatus,
      allowedStatuses,
      cancellationRequested: cancellationRequested,
      cancellationStatus: cancellationStatus,
      originalCancellationRequested: order.cancellationRequested,
      originalCancellationStatus: order.cancellationStatus
    });
    
    return canCancel;
  };

  // COD specific cancellation functions
  const handleCODCancelClick = (order) => {
    setCodOrderToCancel(order);
    setShowCODCancelModal(true);
  };

  const handleCODCancelSuccess = () => {
    fetchOrders(); // Refresh orders
  };

  const handleTrackOrder = (orderId) => {
    setTrackingOrderId(orderId);
    setShowTrackingModal(true);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: UserCircleIcon },
    { id: 'profile', label: 'Profile', icon: PencilSquareIcon },
    { id: 'cart', label: 'Cart', icon: ShoppingCartIcon },
    { id: 'wishlist', label: 'Wishlist', icon: HeartIcon },
    { id: 'orders', label: 'Orders', icon: GiftIcon },
    
  ];

  // JSX for the orders tab
  const OrdersTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-white">Your Orders</h2>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">All Orders</option>
              <option value="processing">Processing</option>
              <option value="confirmed">Confirmed</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">Start shopping to create your first order.</p>
            <div className="mt-6">
              <Link
                to="/shop"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                Browse Shop
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Order Header */}
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-mono text-sm">{order._id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Order Date</p>
                    <p className="font-medium">
                      {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="mt-4 space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center space-x-4">
                        <img
                          src={config.fixImageUrl(item.image)}
                          alt={item.name}
                          className="h-16 w-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = '/placeholder.png';
                            e.target.onerror = null;
                          }}
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-500">
                            Quantity: {item.quantity} × ₹{item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium text-gray-900">
                        ₹{(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-3">
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.orderStatus)}`}>
                        {getStatusIcon(order.orderStatus)}
                        <span>{order.orderStatus?.charAt(0).toUpperCase() + order.orderStatus?.slice(1)}</span>
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${
                        order.paymentStatus === 'completed' 
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : order.paymentStatus === 'failed'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        <CreditCardIcon className="h-4 w-4" />
                        <span>Payment: {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="text-lg font-semibold text-gray-900">₹{order.totalAmount.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => setSelectedOrderId(order._id)}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                      >
                        <EyeIcon className="h-4 w-4" />
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* COD Payment Breakdown */}
                  {order.paymentMethod === 'cod' && order.upfrontAmount > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">COD Payment Breakdown</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-blue-600">Upfront Paid:</p>
                          <p className="font-medium text-blue-800">₹{order.upfrontAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-blue-600">On Delivery:</p>
                          <p className="font-medium text-blue-800">₹{(order.totalAmount - order.upfrontAmount).toFixed(2)}</p>
                        </div>
                      </div>
                      
                      {/* Refund Information for COD Orders */}
                      {order.cancellationStatus === 'approved' && order.refundStatus && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <h5 className="text-sm font-medium text-blue-800 mb-2">Refund Information</h5>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-blue-600">Refund Amount:</span>
                              <span className="font-medium text-blue-800">₹{order.refundAmount?.toFixed(2) || order.upfrontAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-600">Refund Status:</span>
                              <span className={`font-medium ${
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
                                <span className="text-blue-600">Completed On:</span>
                                <span className="font-medium text-blue-800">{format(new Date(order.refundCompletedAt), 'MMM dd, yyyy HH:mm')}</span>
                              </div>
                            )}
                            {order.refundTransactionId && (
                              <div className="flex justify-between">
                                <span className="text-blue-600">Refund ID:</span>
                                <span className="font-medium text-blue-800 text-xs">{order.refundTransactionId}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Shipping Address Preview */}
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Shipping to: {order.address.street}, {order.address.city}, {order.address.state} {order.address.pincode}</p>
                  </div>

                  {/* Cancel Order Button */}
                  {canCancelOrder(order) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => order.paymentMethod === 'cod' ? handleCODCancelClick(order) : handleCancelOrderClick(order)}
                        disabled={cancellingOrderId === order._id}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircleIcon className="h-4 w-4" />
                        {cancellingOrderId === order._id ? 'Submitting...' : 'Request Cancellation'}
                      </motion.button>
                      <p className="text-xs text-gray-500 mt-2">
                        {order.paymentMethod === 'cod' 
                          ? `You can cancel orders while they are being processed${order.upfrontAmount > 0 ? ` (₹${order.upfrontAmount} upfront amount will be refunded)` : ''}` 
                          : 'You can cancel orders (refund will be processed)'}
                      </p>
                    </div>
                  )}

                  {/* Cancellation Info */}
                  {order.cancellationRequested && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          {order.cancellationStatus === 'requested' && (
                            <>
                              <p className="text-sm font-medium text-orange-800">Cancellation Request Submitted</p>
                              <p className="text-xs text-orange-600 mt-1">
                                Reason: {order.cancellationReason || 'No reason provided'}
                              </p>
                              <p className="text-xs text-orange-500 mt-1">
                                Status: Awaiting admin approval
                              </p>
                              {order.cancellationRequestedAt && (
                                <p className="text-xs text-orange-500 mt-1">
                                  Requested on: {format(new Date(order.cancellationRequestedAt), 'MMM dd, yyyy')}
                                </p>
                              )}
                            </>
                          )}
                          {order.cancellationStatus === 'approved' && (
                            <>
                              <p className="text-sm font-medium text-red-800">Order Cancelled</p>
                              <p className="text-xs text-red-600 mt-1">
                                Reason: {order.cancellationReason || 'No reason provided'}
                              </p>
                              {order.cancelledAt && (
                                <p className="text-xs text-red-500 mt-1">
                                  Cancelled on: {format(new Date(order.cancelledAt), 'MMM dd, yyyy')}
                                </p>
                              )}
                              {/* Refund Information for all payment methods */}
                              <div className="mt-2">
                                {order.refundStatus === 'pending' && (
                                  <p className="text-xs text-yellow-600">
                                    💳 Refund Pending - Admin will process refund
                                    {order.paymentMethod === 'cod' && order.refundAmount && (
                                      <span className="block">Amount: ₹{order.refundAmount}</span>
                                    )}
                                  </p>
                                )}
                                {order.refundStatus === 'processing' && (
                                  <p className="text-xs text-blue-600">
                                    💳 Refund Processing - Money will be credited soon
                                    {order.paymentMethod === 'cod' && order.refundAmount && (
                                      <span className="block">Amount: ₹{order.refundAmount}</span>
                                    )}
                                  </p>
                                )}
                                {order.refundStatus === 'completed' && (
                                  <p className="text-xs text-green-600">
                                    ✅ Refund Completed - Money credited to your account
                                    {order.paymentMethod === 'cod' && order.refundAmount && (
                                      <span className="block">Amount: ₹{order.refundAmount}</span>
                                    )}
                                    {order.refundCompletedAt && (
                                      <span className="block">Completed: {format(new Date(order.refundCompletedAt), 'MMM dd, yyyy HH:mm')}</span>
                                    )}
                                    {order.refundTransactionId && (
                                      <span className="block">Refund ID: {order.refundTransactionId}</span>
                                    )}
                                  </p>
                                )}
                                {order.refundStatus === 'failed' && (
                                  <p className="text-xs text-red-600">
                                    ❌ Refund Failed - Please contact support
                                    {order.paymentMethod === 'cod' && order.refundAmount && (
                                      <span className="block">Amount: ₹{order.refundAmount}</span>
                                    )}
                                  </p>
                                )}
                                {!order.refundStatus && order.paymentMethod !== 'cod' && (
                                  <p className="text-xs text-green-600">
                                    💳 Refund will be processed after admin approval
                                  </p>
                                )}
                                {!order.refundStatus && order.paymentMethod === 'cod' && order.upfrontAmount > 0 && (
                                  <p className="text-xs text-green-600">
                                    💳 Upfront amount (₹{order.upfrontAmount}) will be refunded after admin approval
                                  </p>
                                )}
                              </div>
                            </>
                          )}
                          {order.cancellationStatus === 'rejected' && (
                            <>
                              <p className="text-sm font-medium text-red-800">Cancellation Request Rejected</p>
                              <p className="text-xs text-red-600 mt-1">
                                Your cancellation request was rejected
                              </p>
                              {order.cancellationRejectionReason && (
                                <p className="text-xs text-red-600 mt-1">
                                  Reason: {order.cancellationRejectionReason}
                                </p>
                              )}
                              <p className="text-xs text-red-500 mt-1">
                                Your order will continue to be processed
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleTrackOrder(order._id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      <TruckIcon className="h-4 w-4" />
                      Track Order
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedOrderId(order._id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4" />
                      View Details
                    </motion.button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
                <p className="text-gray-600 mt-1">Welcome back, {user?.name}! Manage your profile and orders.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
              </motion.button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 sticky top-8"
              >
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <motion.button
                      key={tab.id}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleTabChange(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-[#8f3a61]-50 text-primary-dark border border-primary shadow-sm'
                          : 'text-black-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <tab.icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </motion.button>
                  ))}
                </nav>
              </motion.div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <motion.div
                        whileHover={{ y: -4 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                          </div>
                          <div className="p-3 bg-primary rounded-xl">
                            <GiftIcon className="h-6 w-6 text-primary-dark" />
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ y: -4 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Cart Items</p>
                            <p className="text-2xl font-bold text-gray-900">{cartItems.length}</p>
                          </div>
                          <div className="p-3 bg-primary rounded-xl">
                            <ShoppingCartIcon className="h-6 w-6 text-primary-dark" />
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ y: -4 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Wishlist Items</p>
                            <p className="text-2xl font-bold text-gray-900">{wishlistItems.length}</p>
                          </div>
                          <div className="p-3 bg-pink-100 rounded-xl">
                            <HeartIcon className="h-6 w-6 text-pink-600" />
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ y: -4 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Account Status</p>
                            <p className="text-2xl font-bold text-green-600">Active</p>
                          </div>
                          <div className="p-3 bg-green-100 rounded-xl">
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleTabChange('cart')}
                          className="flex items-center space-x-3 p-4 bg-[#8f3a61]-300 rounded-xl hover:bg-primary-50 hover:text-white transition-colors"
                        >
                          <ShoppingCartIcon className="h-6 w-6 text-primary-dark" />
                          <span className="font-medium text-gray-900">View Cart</span>
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleTabChange('wishlist')}
                          className="flex items-center space-x-3 p-4 bg-pink-50 rounded-xl hover:bg-pink-100 transition-colors"
                        >
                          <HeartIcon className="h-6 w-6 text-pink-600" />
                          <span className="font-medium text-gray-900">View Wishlist</span>
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleTabChange('orders')}
                          className="flex items-center space-x-3 p-4 bg-secondary rounded-xl hover:bg-primary transition-colors"
                        >
                          <GiftIcon className="h-6 w-6 text-primary-dark" />
                          <span className="font-medium text-gray-900">View Orders</span>
                        </motion.button>
                      </div>
                    </div>


                    {/* Recent Activity */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-primary rounded-lg">
                            <UserCircleIcon className="h-4 w-4 text-primary-dark" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Account logged in</p>
                            <p className="text-sm text-gray-500">Just now</p>
                          </div>
                        </div>
                        
                        {cartItems.length > 0 && (
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                            <div className="p-2 bg-primary rounded-lg">
                              <ShoppingCartIcon className="h-4 w-4 text-primary-dark" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{cartItems.length} items in cart</p>
                              <p className="text-sm text-gray-500">Total: ₹{getTotalPrice().toFixed(2)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Profile Information</h3>
                      {!isEditing && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setIsEditing(true)}
                          className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm sm:text-base"
                        >
                          <PencilSquareIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Edit Profile</span>
                          <span className="sm:hidden">Edit</span>
                        </motion.button>
                      )}
                    </div>

                    {isEditing ? (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              disabled
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                            <textarea
                              name="address"
                              value={formData.address}
                              onChange={handleChange}
                              rows="3"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                        </div>

                        {!user?.googleId && (
                          <div className="border-t pt-6">
                            <h4 className="text-lg font-medium text-gray-900 mb-4">Change Password (Optional)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                                <input
                                  type="password"
                                  name="currentPassword"
                                  value={formData.currentPassword}
                                  onChange={handleChange}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                <input
                                  type="password"
                                  name="newPassword"
                                  value={formData.newPassword}
                                  onChange={handleChange}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                                <input
                                  type="password"
                                  name="confirmNewPassword"
                                  value={formData.confirmNewPassword}
                                  onChange={handleChange}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {user?.googleId && (
                          <div className="border-t pt-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-center space-x-2">
                                <ShieldCheckIcon className="h-5 w-5 text-blue-500" />
                                <span className="text-blue-700 font-medium">Google Account</span>
                              </div>
                              <p className="text-blue-600 text-sm mt-2">
                                You're signed in with Google. Password changes are not available for Google accounts.
                              </p>
                            </div>
                          </div>
                        )}

                        {error && (
                          <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <XCircleIcon className="h-5 w-5 text-red-500" />
                            <span className="text-red-700">{error}</span>
                          </div>
                        )}

                        {message && (
                          <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                            <span className="text-green-700">{message}</span>
                          </div>
                        )}

                        <div className="flex justify-end space-x-4">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                          >
                            Save Changes
                          </motion.button>
                        </div>
                      </form>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                          <p className="text-lg font-medium text-gray-900">{user?.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                          <p className="text-lg font-medium text-gray-900">{user?.email}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                          <p className="text-lg font-medium text-gray-900">{user?.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                          <p className="text-lg font-medium text-gray-900">{user?.address || 'Not provided'}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'cart' && (
                  <motion.div
                    key="cart"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Shopping Cart</h3>
                    
                    {cartItems.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingCartIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                        <p className="text-gray-500 mb-6">Start shopping to add items to your cart.</p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate('/shop')}
                          className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
                        >
                          Browse Products
                        </motion.button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {cartItems.map((item) => (
                          <motion.div
                            key={item.productId || item.product?._id || item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="relative p-4 bg-gray-50 rounded-xl"
                          >
                            {/* Delete Button - Top Right Corner */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRemoveFromCart(item.productId || item.product?._id || item.id)}
                              className="absolute top-2 right-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors z-10"
                              aria-label="Remove from cart"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </motion.button>

                            <div className="flex items-center space-x-3 pr-8">
                              <img
                                src={config.fixImageUrl(getItemImage(item))}
                                alt={item.product?.name || item.name}
                                className="h-16 w-16 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{item.product?.name || item.name}</h4>
                                <p className="text-sm text-gray-500">₹{(item.product?.price || item.price).toFixed(2)}</p>
                                {/* Quantity controls moved below price */}
                                <div className="flex items-center space-x-1 mt-2">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleUpdateQuantity(item.productId || item.product?._id || item.id, item.quantity - 1)}
                                    className="p-1 rounded-full hover:bg-gray-100 border border-gray-200"
                                    disabled={item.quantity <= 1}
                                  >
                                    <MinusIcon className="h-3 w-3" />
                                  </motion.button>
                                  <span className="font-medium px-2 text-sm">{item.quantity}</span>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleUpdateQuantity(item.productId || item.product?._id || item.id, item.quantity + 1)}
                                    className="p-1 rounded-full hover:bg-gray-100 border border-gray-200"
                                  >
                                    <PlusIcon className="h-3 w-3" />
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                          
                        <div className="border-t pt-6">
                          <div className="flex justify-between items-center mb-4">
                          <div className="text-lg font-medium">
                            Total: ₹{getTotalPrice().toFixed(2)}
                          </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              onClick={handleClearCart}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Clear Cart
                              </motion.button>
                            </div>
                            <div className="flex space-x-4">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/shop')}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                              >
                                Continue Shopping
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/checkout')}
                                className="flex-1 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
                              >
                                Proceed to Checkout
                              </motion.button>
                            </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'wishlist' && (
                  <motion.div
                    key="wishlist"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">My Wishlist</h3>
                      <Link
                        to="/wishlist"
                        className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                      >
                        View Full Wishlist →
                      </Link>
                    </div>
                    {wishlistItems.length === 0 ? (
                      <div className="text-center py-12">
                        <HeartIcon className="mx-auto h-16 w-16 text-pink-500 mb-4" />
                        <p className="text-gray-600 mb-6">No items in your wishlist</p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate('/shop')}
                          className="px-6 py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-colors"
                        >
                          Browse Products
                        </motion.button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wishlistItems.map((item) => {
                          const product = item.product;
                          if (!product) return null;

                          const mainImage = product.images && product.images.length > 0 
                            ? config.fixImageUrl(product.images[0]) 
                            : config.fixImageUrl(product.image);

                          return (
                            <motion.div
                              key={item._id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="group relative bg-white rounded-xl overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1"
                            >
                              {/* Remove Button */}
                              <button
                                onClick={() => removeFromWishlist(product._id || product.id)}
                                className="absolute top-2 right-2 z-20 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md backdrop-blur-sm transition-all duration-200"
                                title="Remove from wishlist"
                              >
                                <XMarkIcon className="h-4 w-4 text-red-500 hover:text-red-600" />
                              </button>

                              <Link 
                                to={`/product/${product._id || product.id}`}
                                className="block"
                              >
                                {/* Product Image */}
                                <div className="relative aspect-[4/3.5] w-full overflow-hidden bg-gray-50">
                                  <img
                                    src={mainImage}
                                    alt={product.name || product.title || 'Product'}
                                    className="w-full h-full object-cover object-center transition-transform duration-300 ease-in-out group-hover:scale-105"
                                    onError={e => {
                                      e.target.onerror = null;
                                      e.target.src = 'https://placehold.co/400x500/e2e8f0/475569?text=Image';
                                    }}
                                  />
                                  
                                  {/* Discount Badge */}
                                  {product.regularPrice && product.regularPrice > product.price && (
                                    <div className="absolute top-1.5 left-1.5 bg-[#8f3a61] text-white px-1.5 py-0.5 rounded-md text-xs font-semibold">
                                      -{Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)}%
                                    </div>
                                  )}
                                </div>

                                {/* Product Info */}
                                <div className="p-2.5 space-y-1 text-center">
                                  <h4 className="text-sm font-semibold text-gray-800 truncate group-hover:text-pink-600 transition-colors leading-tight">
                                    {product.name || product.title || product.productName || 'Product Name'}
                                  </h4>
                                  <p className="text-xs text-gray-500 leading-tight">
                                    {product.categoryName || 
                                     product.subCategoryName || 
                                     product.category?.name || 
                                     product.subCategory?.name || 
                                     (typeof product.category === 'string' && !product.category.match(/^[0-9a-fA-F]{24}$/) ? product.category : null) ||
                                     (typeof product.subCategory === 'string' && !product.subCategory.match(/^[0-9a-fA-F]{24}$/) ? product.subCategory : null) ||
                                     'Category'}
                                  </p>
                                  <div className="flex items-baseline justify-center gap-1.5 pt-0.5">
                                    <span className="text-base font-bold text-[#8f3a61]">
                                      ₹{Math.round(product.price)}
                                    </span>
                                    {product.regularPrice && product.regularPrice > product.price && (
                                      <span className="text-xs text-gray-400 line-through">
                                        ₹{Math.round(product.regularPrice)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Link>

                              {/* Add to Cart Button */}
                              <div className="px-2.5 pb-2.5">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    addToCart(product);
                                    toast.success('Added to cart!');
                                  }}
                                  disabled={product.stock === 0 || product.stock <= 0}
                                  className={`w-full font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-300 ease-in-out text-xs ${
                                    product.stock === 0 || product.stock <= 0
                                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                      : 'bg-[#8f3a61] text-white hover:bg-[#8f3a61]/90'
                                  }`}
                                >
                                  <ShoppingCartIcon className="w-3.5 h-3.5" />
                                  {product.stock === 0 || product.stock <= 0 ? 'Out of Stock' : 'Add to cart'}
                                </motion.button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'orders' && (
                  <motion.div
                    key="orders"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Order History</h3>
                    
                    <OrdersTab />
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h3>
                    
                    <div className="space-y-6">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <ShieldCheckIcon className="h-6 w-6 text-green-600" />
                          <div>
                            <h4 className="font-medium text-green-900">Account Security</h4>
                            <p className="text-sm text-green-700">Your account is secure and protected.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <h4 className="font-medium text-gray-900 mb-2">Two-Factor Authentication</h4>
                          <p className="text-sm text-gray-600 mb-4">Add an extra layer of security to your account.</p>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                          >
                            Enable 2FA
                          </motion.button>
                        </div>
                        
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <h4 className="font-medium text-gray-900 mb-2">Login History</h4>
                          <p className="text-sm text-gray-600 mb-4">View your recent login activity.</p>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            View History
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrderId && (
          <OrderDetailsModal
            orderId={selectedOrderId}
            onClose={() => setSelectedOrderId(null)}
          />
        )}
      </AnimatePresence>

      {/* Cancel Order Modal */}
      <AnimatePresence>
        {showCancelModal && orderToCancel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => !cancellingOrderId && setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full border border-gray-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Cancel Order</h3>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Order ID:</p>
                <p className="text-xs font-mono text-gray-900">{orderToCancel._id}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Please provide a reason for cancelling this order..."
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  disabled={cancellingOrderId}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This will submit a cancellation request. Admin will review and confirm within 24 hours. You'll be notified via email.
                </p>
                {orderToCancel.paymentMethod !== 'cod' && (
                  <p className="text-sm text-green-800 mt-2">
                    <strong>💳 Refund:</strong> If approved, your payment will be refunded to your original payment method after admin processes the refund.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancellingOrderId}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Keep Order
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancelOrder}
                  disabled={cancellingOrderId || !cancellationReason.trim()}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancellingOrderId ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Cancelling...
                    </span>
                  ) : (
                    'Submit Cancellation Request'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COD Cancellation Modal */}
      <CODCancellationModal
        isOpen={showCODCancelModal}
        onClose={() => {
          setShowCODCancelModal(false);
          setCodOrderToCancel(null);
        }}
        order={codOrderToCancel}
        onSuccess={handleCODCancelSuccess}
      />

      {/* Order Tracking Modal */}
      {showTrackingModal && (
        <OrderTracking
          orderId={trackingOrderId}
          onClose={() => {
            setShowTrackingModal(false);
            setTrackingOrderId(null);
          }}
        />
      )}
    </>
  );
};

export default Account;