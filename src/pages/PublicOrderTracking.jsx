import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  ArrowLeft,
  Home
} from 'lucide-react';
import orderService from '../services/orderService';
import env from '../config/env';
import { toast } from 'react-hot-toast';
import Loader from '../components/Loader';

const PublicOrderTracking = () => {
  const { orderId } = useParams();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader size="large" text="Loading tracking information..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Tracking</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={fetchTrackingData}
                className="w-full bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
              >
                Try Again
              </button>
              <Link
                to="/"
                className="block w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">Order Tracking</h1>
            </div>
            <Link
              to="/"
              className="flex items-center space-x-2 text-pink-600 hover:text-pink-700 transition-colors"
            >
              <Home className="h-5 w-5" />
              <span>Rikocraft</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
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
                
                <Link
                  to="/shop"
                  className="block w-full text-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              If you have any questions about your order, please contact our customer support.
            </p>
            <div className="flex justify-center space-x-4">
              <a
                href={`mailto:${env.CONTACT_EMAIL}`}
                className="text-pink-600 hover:text-pink-700 transition-colors"
              >
                {env.CONTACT_EMAIL}
              </a>
              <span className="text-gray-300">|</span>
              <Link
                to="/contact"
                className="text-pink-600 hover:text-pink-700 transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PublicOrderTracking;
