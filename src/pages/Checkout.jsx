import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { 
  ArrowLeft, 
  CreditCard, 
  Lock, 
  MapPin, 
  Phone, 
  User, 
  Mail, 
  Building, 
  Truck, 
  Shield,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Gift,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';
import { toast } from 'react-hot-toast';
import config from '../config/config.js';
import apiService from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../components/Loader';
import AuthPrompt from '../components/AuthPrompt';
import FlashMessage from '../components/FlashMessage';
import cartService from '../services/cartService';
import { useSellerNavigation } from '../hooks/useSellerNavigation';
import { settingsAPI } from '../services/api';
import { clearAllData } from '../utils/clearCache';

// Get Razorpay checkout object with enhanced loading
const getRazorpayCheckout = () => {
  return new Promise((resolve, reject) => {
    // Check if Razorpay is already available
    if (window.Razorpay) {
      console.log('Razorpay already loaded');
      resolve(window.Razorpay);
      return;
    }
    
    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src*="razorpay"]');
    if (existingScript) {
      console.log('Razorpay script already in DOM, waiting for load...');
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if (window.Razorpay) {
          clearInterval(checkInterval);
          console.log('Razorpay loaded from existing script');
          resolve(window.Razorpay);
        }
      }, 100);
      
      // Timeout after 15 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Razorpay script failed to load within timeout'));
      }, 15000);
      return;
    }
    
    // Load Razorpay script
    console.log('Loading Razorpay script...');
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      // Wait a bit for Razorpay object to be available
      setTimeout(() => {
        if (window.Razorpay) {
          console.log('Razorpay object available');
          resolve(window.Razorpay);
        } else {
          console.error('Razorpay script loaded but object not available');
          reject(new Error('Razorpay script loaded but Razorpay object not available'));
        }
      }, 100);
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Razorpay script:', error);
      reject(new Error('Failed to load Razorpay script'));
    };
    
    // Add script to head
    document.head.appendChild(script);
    console.log('Razorpay script added to DOM');
  });
};


const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, getTotalPrice, clearCart, getItemImage, sellerToken, setSellerTokenFromURL, clearSellerToken, setCartItems } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const { navigateToCart } = useSellerNavigation();
  
  // Check if we're coming from successful payment
  const paymentSuccess = searchParams.get('paymentSuccess');
  const orderId = searchParams.get('orderId');
  
  // Always set seller token from URL if present (robustness)
  useEffect(() => {
    const urlSellerToken = searchParams.get('seller');
    if (urlSellerToken) {
      setSellerTokenFromURL(urlSellerToken);
    }
  }, [searchParams, setSellerTokenFromURL]);

  // Handle successful payment redirect
  useEffect(() => {
    if (paymentSuccess === 'true' && orderId && cartItems.length > 0) {
      // Automatically place order for successful payment
      handleSuccessfulPaymentOrder();
    }
  }, [paymentSuccess, orderId, cartItems]);

  // Fetch COD upfront amount
  useEffect(() => {
    const fetchCodUpfrontAmount = async () => {
      try {
        const response = await settingsAPI.getCodUpfrontAmount();
        // Accept 0 as a valid value
        let amount = (typeof response.data?.amount !== 'undefined') ? Number(response.data.amount) : (typeof response.amount !== 'undefined' ? Number(response.amount) : 39);
        if (isNaN(amount)) amount = 39;
        setCodUpfrontAmount(amount);
        localStorage.setItem('codUpfrontAmount', amount); // Store for PaymentStatus.jsx
      } catch (error) {
        // Keep default value of 39
      }
    };
    fetchCodUpfrontAmount();
  }, []);
  
  const [activeStep, setActiveStep] = useState('shipping');
  const [formData, setFormData] = useState({
    // Shipping Information
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
    country: user?.country || 'India',
    
    // Billing Information
    billingSameAsShipping: true,
    billingFirstName: '',
    billingLastName: '',
    billingEmail: '',
    billingPhone: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    billingCountry: 'India',
    
    // Payment Information - will be set after cart loads
    paymentMethod: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [cartLoading, setCartLoading] = useState(true);
  const [codUpfrontAmount, setCodUpfrontAmount] = useState(39); // Default value
  const [cartLoaded, setCartLoaded] = useState(false);

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || user.name?.split(' ')[0] || '',
        lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '', // Always use logged-in user's email
        phone: user.phone || '',
        address: user.address || '',
      }));
    } else {
      // If user logs out, clear email field
      setFormData(prev => ({
        ...prev,
        email: '',
      }));
    }
  }, [user]);

  // Copy shipping address to billing when checkbox is checked
  useEffect(() => {
    if (formData.billingSameAsShipping) {
      setFormData(prev => ({
        ...prev,
        billingFirstName: prev.firstName,
        billingLastName: prev.lastName,
        billingEmail: prev.email,
        billingPhone: prev.phone,
        billingAddress: prev.address,
        billingCity: prev.city,
        billingState: prev.state,
        billingZipCode: prev.zipCode,
        billingCountry: prev.country,
      }));
    }
  }, [formData.billingSameAsShipping, formData.firstName, formData.lastName, formData.email, formData.phone, formData.address, formData.city, formData.state, formData.zipCode, formData.country]);

  useEffect(() => {
    if (cartItems.length === 0 && cartLoaded) {
      navigate('/cart');
    }
  }, [cartItems, navigate, cartLoaded]);

  // Force cart refresh from backend on checkout page load
  useEffect(() => {
    const refreshCart = async () => {
      if (isAuthenticated && user && user.email) {
        try {
          const cartData = await cartService.getCart(user.email);
          if (cartData.items) {
            if (typeof setCartItems === 'function') {
              setCartItems(cartData.items);
            }
          }
        } catch (err) {
          
        }
      }
      setCartLoading(false);
      setCartLoaded(true);
    };
    refreshCart();
    // eslint-disable-next-line
  }, []);

  // Determine if COD is available for all cart items
  const isCodAvailableForCart = cartItems.every(item => {
    return item.codAvailable !== false; // treat undefined as true for backward compatibility
  });

  // Set payment method after cart loads and COD availability is determined
  useEffect(() => {
    if (cartLoaded && cartItems.length > 0) {
      if (isCodAvailableForCart) {
        setFormData(prev => ({
          ...prev,
          paymentMethod: 'cod'
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          paymentMethod: 'online'
        }));
      }
    }
  }, [cartLoaded, cartItems, isCodAvailableForCart]);

  // Restore cartItems and formData from localStorage if missing (for payment success redirect)
  useEffect(() => {
    if ((cartItems.length === 0 || !cartItems) && localStorage.getItem('checkoutCartItems')) {
      try {
        const savedCart = JSON.parse(localStorage.getItem('checkoutCartItems'));
        if (Array.isArray(savedCart) && savedCart.length > 0 && typeof setCartItems === 'function') {
          setCartItems(savedCart);
        }
      } catch (e) { /* ignore */ }
    }
    if (!formData.phone && localStorage.getItem('checkoutFormData')) {
      try {
        const savedForm = JSON.parse(localStorage.getItem('checkoutFormData'));
        if (savedForm && typeof savedForm === 'object') {
          // Don't override email if user is logged in - always use logged-in user's email
          setFormData(prev => ({ 
            ...prev, 
            ...savedForm,
            // Always keep logged-in user's email, don't restore from localStorage
            email: user?.email || savedForm.email || prev.email
          }));
        }
      } catch (e) { /* ignore */ }
    }
  }, [user]);

  const validateForm = () => {
    const errors = {};
    const requiredFields = ['firstName', 'lastName', 'phone', 'address', 'city', 'state', 'zipCode'];
    
    // Only require email if user is not logged in
    if (!user) {
      requiredFields.push('email');
    }
    
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });

    // Email validation - only if user is not logged in or email field is not empty
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!user && formData.email && !emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    // Phone validation
    const phoneRegex = /^[\d\s-+()]{10,}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      errors.phone = 'Invalid phone number';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Calculate shipping cost based on payment method and order total
  const calculateShippingCost = () => {
    // Free delivery for all orders
    return 0;
  };

  // Calculate estimated delivery date
  const calculateEstimatedDeliveryDate = () => {
    const today = new Date();
    const state = formData.state;
    
    // Delivery days based on state
    const deliveryDays = {
      // Metro cities - 3-5 days
      'Delhi': 4,
      'Mumbai': 4,
      'Bangalore': 4,
      'Chennai': 4,
      'Kolkata': 4,
      'Hyderabad': 4,
      'Pune': 4,
      'Ahmedabad': 4,
      'Gurgaon': 4,
      'Noida': 4,
      'Ghaziabad': 4,
      'Faridabad': 4,
      'Gurugram': 4,
      
      // Major cities - 5-7 days
      'Maharashtra': 5,
      'Karnataka': 5,
      'Tamil Nadu': 5,
      'Gujarat': 5,
      'Rajasthan': 5,
      'Uttar Pradesh': 5,
      'West Bengal': 5,
      'Andhra Pradesh': 5,
      'Telangana': 5,
      'Kerala': 5,
      'Punjab': 5,
      'Haryana': 5,
      'Madhya Pradesh': 6,
      'Bihar': 6,
      'Odisha': 6,
      'Assam': 7,
      'Jharkhand': 6,
      'Chhattisgarh': 6,
      'Uttarakhand': 6,
      'Himachal Pradesh': 7,
      'Jammu and Kashmir': 8,
      'Ladakh': 8,
      'Manipur': 8,
      'Meghalaya': 8,
      'Mizoram': 8,
      'Nagaland': 8,
      'Tripura': 8,
      'Sikkim': 8,
      'Arunachal Pradesh': 8,
      'Goa': 5,
      'Andaman and Nicobar Islands': 10,
      'Lakshadweep': 10,
      'Dadra and Nagar Haveli': 6,
      'Daman and Diu': 6,
      'Chandigarh': 5,
      'Puducherry': 6
    };
    
    const days = deliveryDays[state] || 7; // Default 7 days
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + days);
    
    return deliveryDate;
  };

  // Calculate COD extra charge (no extra charge, upfront amount is deducted from product price)
  const getCodExtraCharge = () => {
    // No extra charge for COD orders - upfront amount is deducted from product price
    return 0;
  };

  // Calculate final total
  const getFinalTotal = () => {
    const subtotal = getTotalPrice();
    const shipping = calculateShippingCost();
    const codExtra = getCodExtraCharge();
    // Use discounted price if coupon is applied
    const discountedSubtotal = appliedCoupon ? appliedCoupon.finalPrice : subtotal;
    
    // Ensure all values are valid numbers
    const validSubtotal = (typeof subtotal === 'number' && !isNaN(subtotal)) ? subtotal : 0;
    const validShipping = (typeof shipping === 'number' && !isNaN(shipping)) ? shipping : 0;
    const validCodExtra = (typeof codExtra === 'number' && !isNaN(codExtra)) ? codExtra : 0;
    const validDiscountedSubtotal = (typeof discountedSubtotal === 'number' && !isNaN(discountedSubtotal)) ? discountedSubtotal : validSubtotal;
    
    // For all orders, return subtotal + shipping (no extra charges)
    return validDiscountedSubtotal + validShipping;
  };

  // Calculate amount to be paid online (for COD: upfront amount, for online: full amount)
  const getOnlinePaymentAmount = () => {
    if (formData.paymentMethod === 'cod') {
      // For COD orders, upfront amount is paid online
      const upfrontAmount = (typeof codUpfrontAmount === 'number' && !isNaN(codUpfrontAmount)) ? codUpfrontAmount : 40;
      return upfrontAmount;
    } else {
      const finalTotal = getFinalTotal();
      return (typeof finalTotal === 'number' && !isNaN(finalTotal)) ? finalTotal : 0;
    }
  };

  const handleCodOrder = async () => {
    setLoading(true);
    setError(null);
    
    if (!validateForm()) {
      setError("Please fill in all required fields correctly.");
      setLoading(false);
      return;
    }

    // For COD orders, we need to collect upfront payment first
    if (codUpfrontAmount > 0) {
    
      
      // Use Razorpay for upfront payment
      await handleRazorpayPayment();
      return;
    }

    // For COD orders without upfront payment, create order directly
    const orderData = {
      customerName: `${formData.firstName} ${formData.lastName}`,
      email: user?.email || formData.email, // Always use logged-in user's email
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.zipCode,
      country: formData.country,
      items: cartItems.map(item => ({
        productId: item.product?._id || item.id,
        name: item.product?.name || item.name,
        quantity: item.quantity,
        price: item.product?.price || item.price,
        image: getItemImage(item)
      })),
      totalAmount: getFinalTotal(),
      shippingCost: calculateShippingCost(),
      codExtraCharge: 0, // No extra charge
      finalTotal: getFinalTotal(),
      paymentMethod: 'cod',
      paymentStatus: 'pending_upfront',
      upfrontAmount: codUpfrontAmount,
      remainingAmount: getFinalTotal() - codUpfrontAmount,
      sellerToken: sellerToken,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined
    };

    // Save form data to localStorage for potential use
    localStorage.setItem('checkoutFormData', JSON.stringify(formData));

    try {
      const response = await orderService.createOrder(orderData);

      if (response.success) {
        toast.success('Order placed successfully! Pay on delivery.');
        clearCart();
        clearSellerToken();
        // Clear all data including caches
        clearAllData();
        navigate('/account?tab=orders');
      } else {
        setError(response.message || "Failed to create order. Please try again.");
      }
    } catch (err) {
     
      setError("Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setPaymentProcessing(true);
    setError(null);
    try {
      if (!validateForm()) {
        setError("Please fill in all required fields correctly.");
        setPaymentProcessing(false);
        setLoading(false);
        setCouponLoading(false);
        return;
      }

      // Determine payment amount based on payment method
      let paymentAmount;
      if (formData.paymentMethod === 'cod') {
        paymentAmount = codUpfrontAmount; // Use upfront amount for COD
      } else {
        paymentAmount = getOnlinePaymentAmount(); // Use full amount for online payment
      }
      
      if (paymentAmount < 1) {
        setError("Order amount must be at least ₹1 for online payment.");
        setPaymentProcessing(false);
        setLoading(false);
        setCouponLoading(false);
        return;
      }

      // Validate upfront amount for COD orders
      if (formData.paymentMethod === 'cod' && codUpfrontAmount > 0) {
        const totalAmount = getFinalTotal();
        if (codUpfrontAmount >= totalAmount) {
          setError("Upfront amount cannot be greater than or equal to total order amount. Please reduce the upfront amount.");
          setPaymentProcessing(false);
          setLoading(false);
          setCouponLoading(false);
          return;
        }
      }

      // Prepare order data according to Razorpay API requirements
      const orderData = {
        amount: getOnlinePaymentAmount(), // Use discounted amount if coupon applied
        customerName: `${formData.firstName} ${formData.lastName}`,
        email: user?.email || formData.email, // Always use logged-in user's email
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.zipCode,
        country: formData.country,
        items: cartItems.map(item => ({
          productId: item.product?._id || item.id,
          name: item.product?.name || item.name,
          quantity: item.quantity,
          price: item.product?.price || item.price,
          image: getItemImage(item)
        })),
        totalAmount: getFinalTotal(),
        shippingCost: calculateShippingCost(),
        codExtraCharge: getCodExtraCharge(),
        finalTotal: getFinalTotal(),
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentMethod === 'cod' ? 'pending_upfront' : 'processing',
        upfrontAmount: formData.paymentMethod === 'cod' ? codUpfrontAmount : 0,
        remainingAmount: formData.paymentMethod === 'cod' ? (getFinalTotal() - codUpfrontAmount) : 0,
        sellerToken: sellerToken,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined
      };

      // Call backend to create Razorpay order
      console.log('Checkout - Initiating Razorpay payment with order data:', orderData);
      const data = await paymentService.initiateRazorpayPayment(orderData);
      console.log('Checkout - Razorpay payment response:', data);
      
      if (data.success && data.order) {
        
        // Save form data to localStorage for PaymentStatus page
        localStorage.setItem('checkoutFormData', JSON.stringify(formData));
        localStorage.setItem('checkoutCartItems', JSON.stringify(cartItems));
        
        // Get Razorpay checkout object
        try {
          console.log('Getting Razorpay checkout object...');
          const Razorpay = await getRazorpayCheckout();
          console.log('Razorpay checkout object obtained:', Razorpay);
          
          // Validate Razorpay object
          if (!Razorpay) {
            console.error('Razorpay object is null or undefined');
            throw new Error('Razorpay object is null or undefined');
          }
          
          // Razorpay options - minimal configuration to avoid restrictions
          const options = {
            key: config.RAZORPAY.KEY_ID,
            amount: data.order.amount,
            currency: data.order.currency,
            name: 'Riko Craft',
            description: `Payment for order ${data.merchantOrderId}`,
            order_id: data.order.id,
            prefill: {
              name: `${formData.firstName} ${formData.lastName}`,
              email: user?.email || formData.email,
              contact: formData.phone || ''
            },
            theme: {
              color: '#8f3a61'
            },
            // Completely removed config to avoid any payment method restrictions
            handler: async function (response) {
              console.log('Razorpay payment success:', response);
              
              // Verify payment with backend
              try {
                const verificationData = {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                };
                
                const verificationResult = await paymentService.verifyRazorpayCallback(verificationData);
                
                if (verificationResult.success) {
                  toast.success('Payment completed successfully!');
                  // Redirect to success page
                  window.location.href = `${window.location.origin}/payment/status?orderId=${data.order.id}&status=success`;
                } else {
                  toast.error('Payment verification failed. Please contact support.');
                  window.location.href = `${window.location.origin}/payment/status?orderId=${data.order.id}&status=failed`;
                }
              } catch (verificationError) {
                console.error('Payment verification error:', verificationError);
                toast.error('Payment verification failed. Please contact support.');
                window.location.href = `${window.location.origin}/payment/status?orderId=${data.order.id}&status=failed`;
              }
            },
            modal: {
              ondismiss: function() {
                console.log('Payment modal dismissed by user');
                
                // Reset all payment-related states
                setPaymentProcessing(false);
                setLoading(false);
                setError('');
                setCouponLoading(false);
                
                // Force page refresh to reset all states completely
                setTimeout(() => {
                  console.log('Refreshing page after payment modal dismissal...');
                  window.location.reload();
                }, 500);
                
                // Don't show error toast for user cancellation
                // toast.error('Payment was cancelled by the user.');
              }
            }
          };
          
          // Show success message
          toast.success('Redirecting to payment gateway...');
          
          // Validate options before creating Razorpay instance
          console.log('Razorpay options:', options);
          console.log('Order ID:', options.order_id);
          console.log('Amount:', options.amount);
          console.log('Key:', options.key);
          
          // Open Razorpay checkout
          try {
            console.log('Creating Razorpay instance...');
            const razorpay = new Razorpay(options);
            console.log('Razorpay instance created:', razorpay);
            console.log('Razorpay instance type:', typeof razorpay);
            console.log('Razorpay instance methods:', Object.getOwnPropertyNames(razorpay));
            
            console.log('Opening Razorpay checkout...');
            razorpay.open();
            console.log('Razorpay checkout opened successfully');
          } catch (razorpayError) {
            console.error('Error creating/opening Razorpay:', razorpayError);
            throw new Error(`Razorpay initialization failed: ${razorpayError.message}`);
          }
          
        } catch (checkoutError) {
          console.error('Checkout - Razorpay checkout error:', checkoutError);
          console.error('Error details:', {
            message: checkoutError.message,
            stack: checkoutError.stack,
            name: checkoutError.name
          });
          
          let errorMessage = 'Payment gateway initialization failed. Please try again.';
          
          if (checkoutError.message && checkoutError.message.includes('Amount exceeds maximum amount allowed')) {
            errorMessage = 'Payment amount exceeds the maximum limit. Please try with a smaller amount or contact support.';
          } else if (checkoutError.message && checkoutError.message.includes('Invalid amount')) {
            errorMessage = 'Invalid payment amount. Please check your order total.';
          } else if (checkoutError.message && checkoutError.message.includes('Razorpay script failed to load')) {
            errorMessage = 'Payment gateway script failed to load. Please check your internet connection and try again.';
          } else if (checkoutError.message && checkoutError.message.includes('Razorpay object is null')) {
            errorMessage = 'Payment gateway not available. Please refresh the page and try again.';
          } else if (checkoutError.message && checkoutError.message.includes('Razorpay initialization failed')) {
            errorMessage = 'Payment gateway initialization failed. Please try again or contact support.';
          } else if (checkoutError.message) {
            errorMessage = checkoutError.message;
          }
          
          setError(errorMessage);
          setPaymentProcessing(false);
          setLoading(false);
          setCouponLoading(false);
        }
        
      } else {
        console.error('Checkout - Razorpay payment initiation failed:', data);
        setError(data.message || "Failed to initiate payment. Please try again.");
        setPaymentProcessing(false);
        setLoading(false);
        setCouponLoading(false);
      }
      
    } catch (error) {
      console.error('Checkout - Razorpay payment error:', error);
      
      let errorMessage = "Payment processing failed. Please try again.";
      
      if (error.message && error.message.includes('Amount exceeds maximum amount allowed')) {
        errorMessage = 'Payment amount exceeds the maximum limit. Please try with a smaller amount or contact support.';
      } else if (error.message && error.message.includes('Invalid amount')) {
        errorMessage = 'Invalid payment amount. Please check your order total.';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid payment data. Please check your information and try again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Payment gateway error. Please try again later or contact support.';
      }
      
      setError(errorMessage);
      setPaymentProcessing(false);
      setLoading(false);
      setCouponLoading(false);
    } finally {
      setPaymentProcessing(false);
      setLoading(false);
      setCouponLoading(false);
    }
  };


  const handleCouponSubmit = async (e) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');

    try {
      // Use the direct API endpoint
      const validateResponse = await fetch(`${config.API_BASE_URL}/api/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('seller_jwt') ? {
            'Authorization': `Bearer ${localStorage.getItem('seller_jwt')}`
          } : {})
        },
        body: JSON.stringify({
          code: couponCode,
          cartTotal: getTotalPrice()
        })
      });

      const data = await validateResponse.json();

      if (data.success) {
        const { coupon, discountAmount, finalPrice, message } = data.data;
        
        // Apply the coupon
        const applyResponse = await fetch(`${config.API_BASE_URL}/api/coupons/apply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('seller_jwt') ? {
              'Authorization': `Bearer ${localStorage.getItem('seller_jwt')}`
            } : {})
          },
          body: JSON.stringify({ code: coupon.code })
        });

        const applyData = await applyResponse.json();

        if (applyData.success) {
          setAppliedCoupon({
            code: coupon.code,
            discountAmount,
            finalPrice,
            discountPercentage: coupon.discountValue
          });
          setCouponCode('');
          toast.success(message);
        } else {
          setCouponError('Failed to apply coupon. Please try again.');
        }
      } else {
        setCouponError(data.message || 'Invalid coupon code');
      }
    } catch (error) {
     
      const errorMessage = 'Failed to process coupon. Please try again.';
      setCouponError(errorMessage);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = (e) => {
    e.preventDefault(); // Prevent any form submission
    e.stopPropagation(); // Stop event bubbling
    setAppliedCoupon(null);
    setCouponError('');
    toast.success('Coupon removed successfully');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError("Please fill in all required fields correctly.");
      return;
    }

    // Handle different payment methods
    if (formData.paymentMethod === 'cod') {
      await handleCodOrder();
    } else if (formData.paymentMethod === 'razorpay') {
      await handleRazorpayPayment();
    } else {
      setError("Please select a valid payment method.");
    }
  };

  const handleSuccessfulPaymentOrder = async () => {
    try {
      // Check if order has already been placed for this payment
      const orderKey = `order_placed_${orderId}`;
      const orderAlreadyPlaced = localStorage.getItem(orderKey);
      
      if (orderAlreadyPlaced === 'true') {
       
        toast.success('Order already placed successfully!');
        clearCart();
        clearSellerToken();
        // Clear all data including caches
        clearAllData();
        navigate('/');
        return;
      }

      setLoading(true);
      
      // Create order data for successful payment
      const orderData = {
        customerName: `${formData.firstName} ${formData.lastName}`,
        email: user?.email || formData.email, // Always use logged-in user's email
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.zipCode,
        country: formData.country,
        items: cartItems.map(item => ({
          productId: item.product?._id || item.id,
          name: item.product?.name || item.name,
          quantity: item.quantity,
          price: item.product?.price || item.price,
          image: getItemImage(item)
        })),
        totalAmount: getFinalTotal(),
        shippingCost: 0,
        codExtraCharge: 0,
        finalTotal: getFinalTotal(),
        paymentMethod: 'online',
        paymentStatus: 'completed',
        upfrontAmount: 0,
        remainingAmount: 0,
        sellerToken: sellerToken,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        razorpayOrderId: orderId,
      };

      const response = await orderService.createOrder(orderData);

      if (response.success) {
        // Mark this order as placed to prevent duplicates
        localStorage.setItem(orderKey, 'true');
        toast.success('Order placed successfully!');
        
        // Clear cart and all related data
        console.log('Order placed successfully, clearing cart...');
        
        // Clear cart first
        await clearCart();
        clearSellerToken();
        
        // Clear all caches and data
        clearAllData();
        
        // Wait a bit to ensure cart is cleared
        setTimeout(() => {
          console.log('All data cleared, navigating to home...');
          navigate('/');
        }, 500);
      } else {
        toast.error(response.message || 'Failed to place order');
      }
    } catch (err) {
     
      toast.error('Failed to place order: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Show authentication prompt if user is not signed in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-500 via-white to-pink-100">
        <div className="container mx-auto px-4 py-8">
          <AuthPrompt 
            title="Sign In to Checkout"
            message="Please sign in to complete your purchase. This ensures your order is properly tracked and you can access your order history."
            action="checkout"
          />
        </div>
      </div>
    );
  }

  if (cartLoading || !cartLoaded || !formData.paymentMethod) {
    return <Loader />;
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-500 via-white to-pink-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Truck size={48} className="text-pink-400" />
          </div>
          <h2 className="text-2xl font-bold text-pink-900 mb-4">Your cart is empty</h2>
          <p className="text-pink-700 mb-8">Please add items to your cart before proceeding to checkout.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/shop')}
            className="bg-gradient-to-r from-[#8f3a61] to-[#8f3a61] text-white px-8 py-4 rounded-xl font-medium hover:from-[#8f3a61] hover:to-[#8f3a61] transition-all duration-200"
          >
            Continue Shopping
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = appliedCoupon ? appliedCoupon.finalPrice : subtotal;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-pink-100">
        <div className="container mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            {/* Back to Cart Button - Desktop Only */}
            <div className="hidden md:flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={navigateToCart}
                className="flex items-center space-x-2 text-[#8f3a61] hover:text-[#8f3a61]/80 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Cart</span>
              </motion.button>
            </div>
            
            {/* Center Section */}
            <div className="flex-1 text-center">
              <h1 className="text-xl md:text-2xl font-bold text-[#8f3a61]">Secure Checkout</h1>
              <p className="text-[#8f3a61]/70 text-xs md:text-sm mt-0.5">Complete your purchase safely</p>
            </div>
            
            {/* Secure Payment Badge - Desktop Only */}
            <div className="hidden md:flex items-center space-x-2 text-green-600">
              <Shield size={20} />
              <span className="text-sm font-medium">Secure Payment</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Free Delivery Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto my-10 px-4 mb-6"
      >
        <div className="bg-gradient-to-r from-[#8f3a61] to-[#8f3a61] rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Truck size={20} className="text-white" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg">🚚 FREE DELIVERY ON ALL ORDERS</h3>
              <p className="text-white/80 text-sm">No minimum order value required</p>
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl"
            >
              🎉
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Checkout Form */}
          <div className="w-full lg:w-2/3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-[#8f3a61]/20 overflow-hidden"
            >
              <div className="p-8">
              

                <div className="mb-6 p-4 bg-gradient-to-r from-[#8f3a61]/10 to-[#8f3a61]/5 border border-[#8f3a61]/20 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles size={20} className="text-[#8f3a61]" />
                    <p className="text-sm font-medium text-[#8f3a61]">
                      Premium Shopping Experience
                    </p>
                  </div>
                  <p className="text-sm text-[#8f3a61]/70">
                    <span className="text-red-500 font-semibold">*</span> indicates required fields. 
                    Your information is protected with bank-level security.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Shipping Information */}
                  <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-6">
                                          <div className="w-10 h-10 bg-gradient-to-r from-[#8f3a61] to-[#8f3a61] rounded-full flex items-center justify-center">
                      <MapPin size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#8f3a61]">Shipping Information</h3>
                      <p className="text-[#8f3a61]/70 text-sm">Where should we deliver your order?</p>
                    </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-[#8f3a61] mb-2">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#8f3a61] focus:border-transparent transition-all duration-200 ${
                            fieldErrors.firstName ? 'border-red-300 bg-red-50' : 'border-[#8f3a61]/30 bg-[#8f3a61]/5'
                          }`}
                          required
                        />
                        {fieldErrors.firstName && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle size={14} className="mr-1" />
                            {fieldErrors.firstName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#8f3a61] mb-2">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#8f3a61] focus:border-transparent transition-all duration-200 ${
                            fieldErrors.lastName ? 'border-red-300 bg-red-50' : 'border-[#8f3a61]/30 bg-[#8f3a61]/5'
                          }`}
                          required
                        />
                        {fieldErrors.lastName && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle size={14} className="mr-1" />
                            {fieldErrors.lastName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#8f3a61] mb-2">
                          Email <span className="text-red-500">*</span>
                          {user && <span className="text-green-600 text-xs ml-2">(Logged in user)</span>}
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!!user}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#8f3a61] focus:border-transparent transition-all duration-200 ${
                            fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-[#8f3a61]/30 bg-[#8f3a61]/5'
                          } ${user ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          required
                        />
                        {fieldErrors.email && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle size={14} className="mr-1" />
                            {fieldErrors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#8f3a61] mb-2">
                          Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#8f3a61] focus:border-transparent transition-all duration-200 ${
                            fieldErrors.phone ? 'border-red-300 bg-red-50' : 'border-[#8f3a61]/30 bg-[#8f3a61]/5'
                          }`}
                          required
                        />
                        {fieldErrors.phone && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle size={14} className="mr-1" />
                            {fieldErrors.phone}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-pink-900 mb-2">
                          Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 ${
                            fieldErrors.address ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-pink-50/30'
                          }`}
                          required
                        />
                        {fieldErrors.address && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle size={14} className="mr-1" />
                            {fieldErrors.address}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#8f3a61] mb-2">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#8f3a61] focus:border-transparent transition-all duration-200 ${
                            fieldErrors.city ? 'border-red-300 bg-red-50' : 'border-[#8f3a61]/30 bg-[#8f3a61]/5'
                          }`}
                          required
                        />
                        {fieldErrors.city && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle size={14} className="mr-1" />
                            {fieldErrors.city}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#8f3a61] mb-2">
                          State <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#8f3a61] focus:border-transparent transition-all duration-200 ${
                            fieldErrors.state ? 'border-red-300 bg-red-50' : 'border-[#8f3a61]/30 bg-[#8f3a61]/5'
                          }`}
                          required
                        >
                          <option value="">Select State</option>
                          <option value="Andhra Pradesh">Andhra Pradesh</option>
                          <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                          <option value="Assam">Assam</option>
                          <option value="Bihar">Bihar</option>
                          <option value="Chhattisgarh">Chhattisgarh</option>
                          <option value="Goa">Goa</option>
                          <option value="Gujarat">Gujarat</option>
                          <option value="Haryana">Haryana</option>
                          <option value="Himachal Pradesh">Himachal Pradesh</option>
                          <option value="Jharkhand">Jharkhand</option>
                          <option value="Karnataka">Karnataka</option>
                          <option value="Kerala">Kerala</option>
                          <option value="Madhya Pradesh">Madhya Pradesh</option>
                          <option value="Maharashtra">Maharashtra</option>
                          <option value="Manipur">Manipur</option>
                          <option value="Meghalaya">Meghalaya</option>
                          <option value="Mizoram">Mizoram</option>
                          <option value="Nagaland">Nagaland</option>
                          <option value="Odisha">Odisha</option>
                          <option value="Punjab">Punjab</option>
                          <option value="Rajasthan">Rajasthan</option>
                          <option value="Sikkim">Sikkim</option>
                          <option value="Tamil Nadu">Tamil Nadu</option>
                          <option value="Telangana">Telangana</option>
                          <option value="Tripura">Tripura</option>
                          <option value="Uttar Pradesh">Uttar Pradesh</option>
                          <option value="Uttarakhand">Uttarakhand</option>
                          <option value="West Bengal">West Bengal</option>
                          <option value="Delhi">Delhi</option>
                          <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                          <option value="Ladakh">Ladakh</option>
                          <option value="Chandigarh">Chandigarh</option>
                          <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                          <option value="Lakshadweep">Lakshadweep</option>
                          <option value="Puducherry">Puducherry</option>
                          <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                        </select>
                        {fieldErrors.state && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle size={14} className="mr-1" />
                            {fieldErrors.state}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#8f3a61] mb-2">
                          ZIP Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#8f3a61] focus:border-transparent transition-all duration-200 ${
                            fieldErrors.zipCode ? 'border-red-300 bg-red-50' : 'border-[#8f3a61]/30 bg-[#8f3a61]/5'
                          }`}
                          required
                        />
                        {fieldErrors.zipCode && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle size={14} className="mr-1" />
                            {fieldErrors.zipCode}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-white rounded-xl p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
                    <div className="flex flex-col gap-4">
                      {!cartLoaded || !formData.paymentMethod ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-pink-500"></div>
                          <span className="ml-2 text-gray-600">Loading payment options...</span>
                        </div>
                      ) : isCodAvailableForCart ? (
                        <>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="cod"
                              checked={formData.paymentMethod === 'cod'}
                              onChange={handleInputChange}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <span className="text-gray-800 font-medium">Cash on Delivery (COD)</span>
                              <p className="text-sm text-gray-600 mt-1">
                                Pay ₹{codUpfrontAmount} online + remaining amount on delivery
                              </p>
                              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-xs text-blue-700">
                                  <span className="font-medium">Upfront Payment:</span> ₹{codUpfrontAmount} (required)
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                  <span className="font-medium">On Delivery:</span> ₹{(getFinalTotal() - codUpfrontAmount).toFixed(2)}
                                </p>
                                {formData.state && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    <span className="font-medium">Delivery Date:</span> {calculateEstimatedDeliveryDate().toLocaleDateString('en-IN', { 
                                      weekday: 'short', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="razorpay"
                              checked={formData.paymentMethod === 'razorpay'}
                              onChange={handleInputChange}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <span className="text-gray-800 font-medium">UPI/Cards (Razorpay)</span>
                              <p className="text-sm text-gray-600 mt-1">
                                Pay securely using UPI, Cards, Net Banking via Razorpay
                              </p>
                            </div>
                          </label>
                        </>
                      ) : (
                        <>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="razorpay"
                              checked={formData.paymentMethod === 'razorpay'}
                              onChange={handleInputChange}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <span className="text-gray-800 font-medium">UPI/Cards (Razorpay)</span>
                              <p className="text-sm text-gray-600 mt-1">
                                Pay securely using UPI, Cards, Net Banking via Razorpay
                              </p>
                            </div>
                          </label>
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-700">
                              <span className="font-medium">Note:</span> Cash on Delivery is not available for one or more items in your cart.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>


                </form>
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-1/3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-[#8f3a61]/20 p-6 sticky top-24"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-[#8f3a61] to-[#8f3a61] rounded-full flex items-center justify-center">
                  <Truck size={16} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#8f3a61]">Order Summary</h3>
              </div>

              <div className="space-y-4 mb-6">
                {!cartLoaded ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8f3a61]"></div>
                    <span className="ml-3 text-gray-600">Loading cart items...</span>
                  </div>
                ) : (
                  cartItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-4 p-3 bg-[#8f3a61]/5 rounded-xl"
                    >
                      <div className="relative">
                        <img 
                          src={config.fixImageUrl(getItemImage(item))} 
                          alt={item.product?.name || item.name} 
                          className="w-16 h-16 rounded-lg object-cover border border-[#8f3a61]/20" 
                          onError={e => {
                            e.target.onerror = null;
                            if (item.product?.images && item.product.images.length > 0) {
                              const nextImage = item.product.images.find(img => img !== e.target.src);
                              if (nextImage) {
                                e.target.src = config.fixImageUrl(nextImage);
                                return;
                              }
                            }
                            e.target.src = 'https://placehold.co/150x150/e2e8f0/475569?text=Product';
                          }}
                        />
                        <span className="absolute -top-2 -right-2 bg-gradient-to-r from-[#8f3a61] to-[#8f3a61] text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-semibold">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-pink-900 line-clamp-2">
                          {item.product?.name || item.name}
                        </h4>
                        <p className="text-sm text-pink-600">
                          ₹{(item.product?.price || item.price).toFixed(2)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-pink-900">
                        ₹{((item.product?.price || item.price) * item.quantity).toFixed(2)}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Free Delivery Highlight */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-6 p-4 bg-gradient-to-r from-[#8f3a61] to-[#8f3a61] rounded-xl text-white shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Truck size={16} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">🚚 FREE DELIVERY</h4>
                      <p className="text-white/80 text-sm">On all orders nationwide</p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-2xl font-bold"
                  >
                    🎉
                  </motion.div>
                </div>
              </motion.div>

              {/* Coupon Code Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mb-6 p-4 bg-gradient-to-r from-[#8f3a61]/10 to-[#8f3a61]/5 border border-[#8f3a61]/20 rounded-xl"
              >
                <div className="flex items-center space-x-2 mb-4">
                  <Gift size={20} className="text-[#8f3a61]" />
                  <h3 className="text-lg font-semibold text-[#8f3a61]">Have a coupon?</h3>
                </div>
                {!appliedCoupon ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setCouponError(''); // Clear error when user types
                      }}
                      placeholder="Enter coupon code"
                      className="flex-1 px-4 py-3 sm:py-2 border border-[#8f3a61]/30 rounded-lg focus:ring-2 focus:ring-[#8f3a61] focus:border-transparent bg-white text-base sm:text-sm"
                      disabled={couponLoading}
                    />
                    <button
                      onClick={handleCouponSubmit}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-6 py-3 sm:px-4 sm:py-2 bg-gradient-to-r from-[#8f3a61] to-[#8f3a61] text-white rounded-lg hover:from-[#8f3a61] hover:to-[#8f3a61] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm font-medium"
                    >
                      {couponLoading ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2">
                      <CheckCircle size={20} className="text-green-500" />
                      <div>
                        <p className="text-green-700 font-medium">{appliedCoupon.code}</p>
                        <p className="text-sm text-green-600">
                          {appliedCoupon.discountPercentage}% off (₹{appliedCoupon.discountAmount.toFixed(2)} saved)
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      type="button"
                      className="text-[#8f3a61] hover:text-[#8f3a61]/80 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="mt-2 text-red-500 text-sm flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {couponError}
                  </p>
                )}
              </motion.div>

              <div className="bg-white rounded-xl p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                {!cartLoaded || !formData.paymentMethod ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
                    <span className="ml-2 text-gray-600">Calculating totals...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal ({cartItems.length} items)</span>
                      <span>₹{getTotalPrice().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Shipping</span>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex items-center space-x-2"
                      >
                        <span className="text-green-600 font-bold">FREE</span>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="text-green-500"
                        >
                          ✨
                        </motion.div>
                      </motion.div>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({appliedCoupon.code})</span>
                        <span>-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total Amount</span>
                        <span>₹{getFinalTotal().toFixed(2)}</span>
                      </div>
                      {formData.state && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-blue-700">
                            <Clock size={16} />
                            <span className="font-medium">Estimated Delivery:</span>
                            <span>{calculateEstimatedDeliveryDate().toLocaleDateString('en-IN', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}</span>
                          </div>
                        </div>
                      )}
                      {formData.paymentMethod === 'cod' && codUpfrontAmount === 0 && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="text-sm text-green-700 font-medium mb-2">Payment Breakdown:</div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-green-600">Upfront Payment (Online):</span>
                              <span className="font-medium text-green-700">₹0</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-600">On Delivery:</span>
                              <span className="font-medium text-green-700">₹{getFinalTotal().toFixed(2)}</span>
                            </div>
                            <div className="border-t border-green-200 pt-1 mt-1">
                              <div className="flex justify-between font-medium">
                                <span className="text-green-800">Total:</span>
                                <span className="text-green-800">₹{getFinalTotal().toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading || paymentProcessing || !cartLoaded || !formData.paymentMethod}
                className="w-full mt-6 bg-gradient-to-r from-[#8f3a61] to-[#8f3a61] text-white px-6 py-4 rounded-xl font-semibold hover:from-pink-600 hover:to-pink-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading || paymentProcessing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : !cartLoaded || !formData.paymentMethod ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Lock size={20} />
                    <span>
                      {formData.paymentMethod === 'cod' && codUpfrontAmount === 0
                        ? 'Place Order (Pay on Delivery)'
                        : formData.paymentMethod === 'cod'
                          ? `Pay ₹${codUpfrontAmount} Online + Rest on Delivery`
                          : 'Proceed to Razorpay Payment'}
                    </span>
                  </>
                )}
              </motion.button>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl"
                >
                  <p className="text-red-700 text-sm flex items-center">
                    <AlertCircle size={16} className="mr-2" />
                    {error}
                  </p>
                </motion.div>
              )}

              <div className="mt-4 p-3 bg-pink-50 rounded-xl">
                <div className="flex items-center space-x-2 text-sm text-pink-700">
                  <Shield size={16} />
                  <span>Your payment is secured with SSL encryption</span>
                </div>
              </div>

              {/* Timeframes Section */}
              <div className="mt-4 p-3 bg-pink-50 rounded-xl">
                <div className="space-y-2 text-sm text-pink-700">
                  <div className="flex items-start gap-2">
                    <Clock size={16} className="mt-0.5" />
                    <div>
                      <span className="font-medium">Delivery:</span> Products will be delivered by {calculateEstimatedDeliveryDate().toLocaleDateString('en-IN', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <RefreshCw size={16} className="mt-0.5" />
                    <div>
                      <span className="font-medium">Refunds:</span> Will be credited into original payment method after admin processes the refund
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Truck size={16} className="mt-0.5" />
                    <div>
                      <span className="font-medium">Replacements:</span> Will be delivered within 5-7 days
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 