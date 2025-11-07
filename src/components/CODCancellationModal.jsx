import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import orderService from '../services/orderService';

const CODCancellationModal = ({ isOpen, onClose, order, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    setLoading(true);
    try {
      const response = await orderService.requestCODCancellation(order._id, reason);
      
      if (response.success) {
        toast.success('Cancellation request submitted successfully');
        onSuccess && onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to submit cancellation request');
      }
    } catch (error) {
      console.error('Error requesting COD cancellation:', error);
      toast.error(error.message || 'Failed to submit cancellation request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
            Cancel COD Order
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-orange-500 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-800">Important Information</h3>
                <p className="text-sm text-orange-700 mt-1">
                  Cancelling this COD order will:
                </p>
                <ul className="text-sm text-orange-700 mt-2 list-disc list-inside space-y-1">
                  <li>Cancel the order and stop processing</li>
                  {order.upfrontAmount > 0 && (
                    <li>Initiate refund of ₹{order.upfrontAmount} upfront amount</li>
                  )}
                  <li>Remove the order from your order history</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Cancellation *
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Please explain why you want to cancel this order..."
                required
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={loading}
              >
                Keep Order
              </button>
              <button
                type="submit"
                disabled={loading || !reason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cancel Order
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CODCancellationModal;
