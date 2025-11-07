import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const PhoneCollectionModal = ({ isOpen, onClose, onPhoneSubmit }) => {
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [otpWidgetShown, setOtpWidgetShown] = useState(false);
  const widgetScriptLoaded = useRef(false);

  useEffect(() => {
    // Dynamically load MSG91 widget script once
    if (!widgetScriptLoaded.current) {
      const script = document.createElement('script');
      script.src = 'https://verify.msg91.com/otp-provider.js';
      script.async = true;
      script.onload = () => {
        widgetScriptLoaded.current = true;
      };
      document.body.appendChild(script);
    }
  }, []);

  // Validate phone number
  const validatePhone = (phoneNumber) => {
    const phoneRegex = /^[6-9][0-9]{9}$/;
    if (!phoneNumber) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (!phoneRegex.test(phoneNumber)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  // Handle phone input change
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(value);
    setPhoneError('');
    setOtpVerified(false);
    setOtpWidgetShown(false);
  };

  // Show OTP widget when phone is valid
  useEffect(() => {
    if (phone.length === 10 && !phoneError && !otpWidgetShown) {
      triggerOtpWidget();
    }
  }, [phone, phoneError, otpWidgetShown]);

  // Trigger OTP widget
  const triggerOtpWidget = () => {
    setOtpError("");
    setOtpSuccess("");
    setOtpLoading(true);
    
    if (!window.initSendOTP) {
      setOtpError("OTP widget not loaded. Please try again.");
      setOtpLoading(false);
      return;
    }

    const configuration = {
      widgetId: "3567686d316c363335313136",
      tokenAuth: "458779TNIVxOl3qDwI6866bc33P1",
      identifier: '91' + phone,
      success: async (data) => {
        setOtpVerified(true);
        setOtpSuccess("Phone verified successfully!");
        setOtpLoading(false);
        setOtpWidgetShown(true);
      },
      failure: (error) => {
        setOtpError(error?.message || "OTP verification failed");
        setOtpVerified(false);
        setOtpLoading(false);
        setOtpWidgetShown(false);
      },
    };
    window.initSendOTP(configuration);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePhone(phone)) {
      return;
    }
    
    if (!otpVerified) {
      setPhoneError('Please verify your phone number with OTP');
      return;
    }

    try {
      // Submit phone number
      await onPhoneSubmit('91' + phone);
      toast.success('Phone number updated successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to update phone number');
    }
  };

  // Handle modal close
  const handleClose = () => {
    setPhone('');
    setPhoneError('');
    setOtpVerified(false);
    setOtpLoading(false);
    setOtpError('');
    setOtpSuccess('');
    setOtpWidgetShown(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Complete Your Profile
                  </h3>
                  <p className="text-sm text-gray-600">
                    Add your phone number for better experience
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Phone Input */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="Enter your 10-digit mobile number"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      phoneError ? 'border-red-300' : 'border-gray-300'
                    }`}
                    maxLength={10}
                  />
                  {otpVerified && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </div>
                {phoneError && (
                  <p className="mt-1 text-sm text-red-600">{phoneError}</p>
                )}
              </div>

              {/* OTP Status */}
              {otpLoading && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Sending OTP...</span>
                </div>
              )}
              
              {otpSuccess && (
                <div className="flex items-center space-x-2 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-sm">{otpSuccess}</span>
                </div>
              )}
              
              {otpError && (
                <div className="flex items-center space-x-2 text-red-600">
                  <span className="text-sm">{otpError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                >
                  Skip for Now
                </button>
                <button
                  type="submit"
                  disabled={!otpVerified || otpLoading}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                >
                  Complete Profile
                </button>
              </div>
            </form>

            {/* Info */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Your phone number helps us provide better customer support and order updates.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PhoneCollectionModal;
