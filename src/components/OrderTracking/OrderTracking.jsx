import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, 
  Package, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Calendar,
  ExternalLink,
  Download,
  RotateCcw,
  X,
  Share2,
  Copy
} from 'lucide-react';
import orderService from '../../services/orderService';
import { toast } from 'react-hot-toast';

const OrderTracking = ({ orderId, onClose }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchTrackingData();
    }
  }, [orderId]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getOrderTracking(orderId);
      if (response.success) {
        setTrackingData(response.order);
      } else {
        setError(response.message || 'Failed to fetch tracking data');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch tracking data');
      toast.error('Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await orderService.generateInvoice(orderId);
      
      // Create blob and download
      const blob = new Blob([response], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${trackingData?.invoiceNumber || orderId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully!');
    } catch (err) {
      toast.error('Failed to download invoice');
    }
  };

  const handleReturnRequest = async () => {
    if (!returnReason.trim()) {
      toast.error('Please provide a reason for return');
      return;
    }

    try {
      setSubmittingReturn(true);
      const response = await orderService.requestOrderReturn(orderId, returnReason);
      if (response.success) {
        toast.success('Return request submitted successfully!');
        setShowReturnModal(false);
        setReturnReason('');
        fetchTrackingData(); // Refresh data
      } else {
        toast.error(response.message || 'Failed to submit return request');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit return request');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleShareOrder = async () => {
    try {
      const shareData = {
        title: `Order Tracking - ${trackingData?.trackingNumber || orderId}`,
        text: `Track your Rikocraft order: ${trackingData?.trackingNumber || orderId}`,
        url: `${window.location.origin}/track-order/${orderId}`
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Order shared successfully!');
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Order tracking link copied to clipboard!');
      }
    } catch (err) {
      // Fallback: Copy to clipboard
      try {
        const shareUrl = `${window.location.origin}/track-order/${orderId}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Order tracking link copied to clipboard!');
      } catch (clipboardErr) {
        toast.error('Failed to share order');
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-5 w-5" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5" />;
      case 'manufacturing':
        return <Package className="h-5 w-5" />;
      case 'shipped':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'confirmed':
        return 'text-blue-600 bg-blue-100';
      case 'manufacturing':
        return 'text-purple-600 bg-purple-100';
      case 'shipped':
        return 'text-indigo-600 bg-indigo-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canReturn = trackingData?.orderStatus === 'delivered' && !trackingData?.returnRequested;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
            <span className="ml-3 text-gray-600">Loading tracking information...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Tracking</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={fetchTrackingData}
                className="flex-1 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Order Tracking</h2>
              <p className="text-sm text-gray-500">Order ID: {orderId}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Current Status */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-full ${getStatusColor(trackingData?.orderStatus)}`}>
                    {getStatusIcon(trackingData?.orderStatus)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {trackingData?.orderStatus?.replace('_', ' ')}
                    </h3>
                    <p className="text-gray-600">
                      {trackingData?.orderStatus === 'delivered' 
                        ? 'Your order has been delivered successfully'
                        : 'Your order is being processed'
                      }
                    </p>
                  </div>
                </div>
                <div className="md:text-right">
                  <p className="text-sm text-gray-500">Tracking Number</p>
                  <p className="font-mono text-base md:text-lg font-semibold text-gray-900 break-all md:break-normal">
                    {trackingData?.trackingNumber || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            {trackingData?.timeline && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h3>
                <div className="space-y-4">
                  {trackingData.timeline.map((step, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Clock className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">{step.title}</h4>
                          <span className="text-xs text-gray-500">
                            {formatDate(step.date)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                        {step.trackingNumber && (
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Tracking:</span>
                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                              {step.trackingNumber}
                            </span>
                            {step.courierProvider && (
                              <span className="text-xs text-gray-500">
                                via {step.courierProvider}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-pink-600" />
                  Delivery Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Estimated Delivery</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(trackingData?.estimatedDeliveryDate)}
                    </p>
                  </div>
                  {trackingData?.actualDeliveryDate && (
                    <div>
                      <p className="text-sm text-gray-500">Actual Delivery</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(trackingData.actualDeliveryDate)}
                      </p>
                    </div>
                  )}
                  {/* Courier Information - Desktop Only */}
                  <div className="hidden md:block">
                    <p className="text-sm text-gray-500">Courier</p>
                    <p className="font-medium text-gray-900">
                      {trackingData?.courierProvider || 'Not assigned'}
                    </p>
                  </div>
                  {trackingData?.courierTrackingUrl && (
                    <a
                      href={trackingData.courierTrackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden md:inline-flex items-center text-pink-600 hover:text-pink-700 text-sm"
                    >
                      Track on courier website
                      <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-pink-600" />
                  Order Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={handleDownloadInvoice}
                    className="w-full flex items-center justify-center space-x-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Invoice</span>
                  </button>
                  
                  <button
                    onClick={handleShareOrder}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share Order</span>
                  </button>
                  
                  {canReturn && (
                    <button
                      onClick={() => setShowReturnModal(true)}
                      className="w-full flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Request Return</span>
                    </button>
                  )}

                  {trackingData?.returnRequested && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Return Requested:</strong> {trackingData.returnStatus}
                      </p>
                      {trackingData.returnReason && (
                        <p className="text-xs text-yellow-700 mt-1">
                          Reason: {trackingData.returnReason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Return Request Modal */}
        {showReturnModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Return</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Return <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="Please provide a reason for returning this order..."
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                  />
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Return requests are subject to approval. Admin will review and respond within 24 hours.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowReturnModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReturnRequest}
                    disabled={submittingReturn || !returnReason.trim()}
                    className="flex-1 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReturn ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};

export default OrderTracking;
