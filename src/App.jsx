import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SocketProvider } from './contexts/SocketContext';
import userActivityService from './services/userActivityService';

import Loader from './components/Loader';
import Header from './components/Header/Header';
import AdBanner from './components/AdBanner/AdBanner';
import Categories from './components/Categories/Categories';
import FeaturedProducts from './components/Products/FeaturedProducts';
import WeeklyBestsellers from './components/Products/WeeklyBestsellers';
import Testimonials from './components/Testimonials/Testimonials';
import Footer from './components/Footer/Footer';
import MissionVision from './components/MissionVision/MissionVision';
import FAQ from './components/FAQ/FAQ';
import ContactPage from './pages/ContactPage';
import Shop from './pages/Shop';
import Login from './pages/Login';
import Signup from './pages/Signup';  
import Account from './pages/Account';  
import Wishlist from './pages/Wishlist';
import ProductView from './pages/ProductView';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import useScrollToTop from './hooks/useScrollToTop';
import MostLoved from './components/Products/MostLoved';
import Cart from './components/Cart';
import Checkout from './pages/Checkout';
import Toast from './components/Toast/Toast';
import ForgotPassword from './pages/ForgotPassword';
import AboutUs from './pages/AboutUs';
import OrderConfirmation from './pages/OrderConfirmation';
import SubCategoryPage from './pages/SubCategoryPage';

import Policies from './pages/Policies';
import PaymentStatus from './pages/PaymentStatus';
import BlogsPage from './pages/BlogsPage';
import BlogDetail from './pages/BlogDetail';
import AboutUsPage from './pages/AboutUsPage';
import Notifications from './pages/Notifications';
import PublicOrderTracking from './pages/PublicOrderTracking';
import SupportCenter from './pages/SupportCenter';
import AnnouncementBanner from './components/AnnouncementBanner/AnnouncementBanner';
import SEO from './components/SEO/SEO';
import { seoConfig, defaultSEO } from './config/seo';
import { clearNotificationData } from './utils/clearNotificationData';
import { preloadCommonData } from './services/dataCacheService';
import config from './config/config';

// Protected Route component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader size="md" text="Loading..." />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return children;
};

// Simple Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">Please try refreshing the page.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  useScrollToTop();
 const {toast, setToast} = useCart();
  const { loading: authLoading } = useAuth();
  const location = useLocation();
  
  // Clear old notification data on app load
  useEffect(() => {
    clearNotificationData();
  }, []);

  // Preload common data for better navigation
  useEffect(() => {
    const preloadData = async () => {
      try {
        await preloadCommonData(config);
        console.log('📦 Common data preloaded successfully');
      } catch (error) {
        console.error('📦 Failed to preload common data:', error);
      }
    };

    preloadData();
  }, []);

  // Track page views
  useEffect(() => {
    const page = location.pathname;
    userActivityService.trackPageView(page);
  }, [location.pathname]);

  // SEO configuration based on current route
  const getSEOConfig = () => {
    const path = location.pathname;
    
    if (path === '/') return seoConfig.home;
    if (path === '/shop') return seoConfig.shop;
    if (path === '/about') return seoConfig.about;
    if (path === '/contact') return seoConfig.contact;
    if (path === '/login') return seoConfig.login;
    if (path === '/signup') return seoConfig.signup;
    if (path === '/policies') return seoConfig.policies;
  
    
    return defaultSEO;
  };

  // Global seller token handler

  // Show loading only if auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader size="md" text="Loading..." showLogo={true} />
      </div>
    );
  }

  const seoData = getSEOConfig();
  
  return (
    <div className="min-h-screen">
      <SEO {...seoData} />
      <Header />
      <div className="pt-[100px] md:pt-[188px] pb-16 md:pb-0">
        <Routes>
        <Route path="/" element={
          <main>
            <ErrorBoundary>
              <AdBanner />
            </ErrorBoundary>
            <ErrorBoundary>
              <Categories/>
            </ErrorBoundary>
            <ErrorBoundary>
              <FeaturedProducts />
            </ErrorBoundary>
            <ErrorBoundary>
              <WeeklyBestsellers />
            </ErrorBoundary>
            <ErrorBoundary>
              <MostLoved />
            </ErrorBoundary>
            <ErrorBoundary>
              <Testimonials />
            </ErrorBoundary>
            <ErrorBoundary>
              <MissionVision />
            </ErrorBoundary>
          </main>
        } />
       
        
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/category/:categoryId" element={<SubCategoryPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/wishlist" element={<Wishlist />} />
    
        
    
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
        <Route path="/product/:id" element={<ProductView />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/blogs" element={<BlogsPage />} />
        <Route path="/blogs/:slug" element={<BlogDetail />} />
        <Route path="/about-us" element={<AboutUsPage />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/support" element={<SupportCenter />} />
        <Route path="/payment/status" element={<PaymentStatus />} />
        <Route path="/track-order/:orderId" element={<PublicOrderTracking />} />

        </Routes>
      </div>
      <Footer />
      <ScrollToTop />
       <Toaster position="top-right" />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <CartProvider>
        <AuthProvider>
          <WishlistProvider>
            <NotificationProvider>
              <SocketProvider>
                <Router>
                  <AppContent />
                </Router>
              </SocketProvider>
            </NotificationProvider>
          </WishlistProvider>
        </AuthProvider>
      </CartProvider>
    </ErrorBoundary>
  );
}

export default App;
