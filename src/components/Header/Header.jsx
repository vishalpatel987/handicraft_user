import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Menu, X, ChevronDown, Search, User, Heart, Home, ShoppingCart, Phone, Mail, BookOpen } from 'lucide-react';
import NotificationBell from '../NotificationBell/NotificationBell';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import logo from '/logo.png';
import config from '../../config/config.js';
import env from '../../config/env';
import axios from 'axios';
import Loader from '../Loader';
import { useSellerNavigation } from '../../hooks/useSellerNavigation';
import userActivityService from '../../services/userActivityService';
import AnnouncementBanner from '../AnnouncementBanner/AnnouncementBanner';


const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { getWishlistCount, wishlistItems } = useWishlist();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDesktopSearchFocused, setIsDesktopSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const searchInputRef = useRef(null);
  const searchBarRef = useRef(null);
  const desktopSearchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, getTotalItems } = useCart();
  const { user } = useAuth();
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState('menu');
  const [expandedMobileCategories, setExpandedMobileCategories] = useState({});
  const { navigateToHome, navigateToShop, navigateToProduct } = useSellerNavigation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    // Close on outside click
    const handleClickOutside = (e) => {
      if (isSearchOpen && searchBarRef.current && !searchBarRef.current.contains(e.target)) {
        setIsSearchOpen(false);
        setSearchResults([]);
        setSearchQuery('');
      }
      if (isDesktopSearchFocused && desktopSearchRef.current && !desktopSearchRef.current.contains(e.target)) {
        setIsDesktopSearchFocused(false);
        setSearchResults([]);
        setSearchQuery('');
      }
    };
    // Close on Esc
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setSearchResults([]);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isSearchOpen]);

  // Search products as user types with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      setSearchLoading(true);
      setSearchError(null);
      fetch(config.API_URLS.SHOP)
        .then(res => res.json())
        .then(data => {
          const q = searchQuery.trim().toLowerCase();
          const results = data.filter(p =>
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.description && p.description.toLowerCase().includes(q))
          );
          setSearchResults(results);
          setSearchLoading(false);
        })
        .catch(err => {
          setSearchError('Failed to fetch products');
          setSearchLoading(false);
        });
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Fetch categories for mobile menu
  useEffect(() => {
    setCategoriesLoading(true);
    axios.get(`${config.API_URLS.CATEGORIES}/hierarchy`)
      .then(response => {
        const categories = response.data.categories || [];
        console.log('Header - Fetched categories with hierarchy:', categories);
        
        // Process categories to include sub-categories in the format expected by the UI
        const processedCategories = categories.map(category => ({
          _id: category._id,
          id: category._id,
          name: category.name,
          subCategories: category.subCategories || []
        }));
        
        setDynamicCategories(processedCategories);
      })
      .catch(error => {
        console.error('Error fetching categories:', error);
        setDynamicCategories([]);
      })
      .finally(() => {
        setCategoriesLoading(false);
      });
  }, []);

  const handleCategoryClick = (category, subcategory = null, item = null) => {
    // Find the category object to check if it has subcategories
    const categoryObj = dynamicCategories.find(cat => cat.name === category);
    
    if (categoryObj && categoryObj.subCategories && categoryObj.subCategories.length > 0) {
      // Track category visit
      userActivityService.trackCategoryVisit(categoryObj._id, subcategory);
      // Navigate to subcategory page if category has subcategories
      navigate(`/category/${categoryObj._id}${subcategory ? `?subcategory=${subcategory}` : ''}`);
    } else {
      // Track category visit
      userActivityService.trackCategoryVisit(categoryObj._id, subcategory);
      // Navigate to shop page with category filter
    navigate('/shop', { 
      state: { 
        selectedCategory: {
          main: category,
          sub: subcategory,
          item: item
        }
      }
    });
    }
    setIsMobileMenuOpen(false);
  };

  const toggleMobileCategory = (categoryName) => {
    setExpandedMobileCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Track search activity
      userActivityService.trackSearch(searchQuery.trim());
      navigateToShop();
      setIsMobileMenuOpen(false);
    }
  };

  const handleSearchIconClick = () => {
    setIsSearchOpen((prev) => !prev);
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
  };

  const handleResultClick = (id) => {
    setIsSearchOpen(false);
    setIsDesktopSearchFocused(false);
    setSearchResults([]);
    setSearchQuery('');
    navigateToProduct(id);
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Blog', path: '/blogs' },
    { name: 'Support', path: '/support' },
  ];

  const MmenuItems = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Blog', path: '/blogs' },
    { name: 'Support', path: '/support' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];


  const mobileMenuVariants = {
    closed: {
      x: '-100%',
      transition: {
        type: 'tween',
        duration: 0.4,
        ease: [0.4, 0.0, 0.2, 1]
      }
    },
    open: {
      x: 0,
      transition: {
        type: 'tween',
        duration: 0.4,
        ease: [0.4, 0.0, 0.2, 1]
      }
    }
  };

  return (
    <>
      {/* Announcement Banner - Disabled, using notification bell instead */}
      {/* <AnnouncementBanner location={location.pathname === '/' ? 'home' : location.pathname.split('/')[1] || 'all'} /> */}
      
      {/* Animated Search Bar Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-0 left-0 w-full z-[20000] bg-white/900 backdrop-blur-md shadow-2xl border-b border-gray-100 px-4 py-4 flex flex-col items-center"
            ref={searchBarRef}
          >
            <form onSubmit={handleSearch} className="w-full max-w-2xl relative flex">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-6 pr-12 py-3 border-0 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 shadow-lg bg-gray-50/80 backdrop-blur-sm"
              />
              <button
                type="submit"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-pink-600 transition-colors duration-200"
              >
                <Search size={20} />
              </button>
            </form>
            {/* Results Dropdown */}
            <div className="w-full max-w-2xl mt-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-96 overflow-y-auto">
              {searchLoading && (
                <div className="flex items-center justify-center py-8 text-pink-600">
                  <Loader />
                </div>
              )}
              {searchError && (
                <div className="py-8 text-center text-red-500">{searchError}</div>
              )}
              {!searchLoading && !searchError && searchResults.length > 0 && (
                <div className="p-2">
                  <div className="text-xs text-gray-400 px-4 py-2 border-b border-gray-100">
                    {searchResults.length} product{searchResults.length !== 1 ? 's' : ''} found
                  </div>
                  <ul>
                    {searchResults.slice(0, 8).map(product => (
                      <li
                        key={product._id}
                        className="flex items-center px-4 py-3 hover:bg-pink-50/80 cursor-pointer transition-all duration-200 rounded-lg mx-2 my-1"
                        onClick={() => handleResultClick(product._id)}
                      >
                        <img
                          src={config.fixImageUrl(product.image)}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg mr-3 border border-gray-200 shadow-sm flex-shrink-0"
                          onError={e => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/48x48/e2e8f0/475569?text=Product';
                          }}
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500 line-clamp-2 leading-relaxed mt-1">{product.description}</div>
                        </div>
                        <div className="ml-3 text-pink-600 font-bold whitespace-nowrap text-sm">₹{product.price}</div>
                      </li>
                    ))}
                  </ul>
                  {searchResults.length > 8 && (
                    <div className="border-t border-gray-100 px-4 py-3">
                      <button
                        onClick={() => {
                          navigate('/shop', { state: { searchQuery } });
                          setIsSearchOpen(false);
                          setSearchResults([]);
                          setSearchQuery('');
                        }}
                        className="w-full text-center text-sm text-pink-600 hover:text-pink-700 font-medium py-2 hover:bg-pink-50 rounded-lg transition-colors duration-200"
                      >
                        View all {searchResults.length} results →
                      </button>
                    </div>
                  )}
                </div>
              )}
              {!searchLoading && !searchError && searchQuery && searchResults.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  <div className="text-sm">No products found for "{searchQuery}"</div>
                  <div className="text-xs text-gray-400 mt-1">Try different keywords</div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header 
        className="fixed top-0 left-0 w-full z-[10000] transition-all duration-500"
        style={{ 
          backgroundImage: "linear-gradient(135deg, rgba(119, 42, 75, 0.95) 0%, rgba(143, 58, 97, 0.95) 50%, rgba(119, 42, 75, 0.95) 100%), url('/footer.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Top Bar - Desktop Only */}
        <div className="hidden md:block border-b border-white/10">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-12 text-sm">
              <div className="flex items-center space-x-8">
                
                <a href={`mailto:${env.CONTACT_EMAIL}`} className="text-white/90 hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <Mail size={16} className="opacity-80" />
                  {env.CONTACT_EMAIL}
                </a>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/about" className="text-white/90 hover:text-white transition-colors duration-200">About</a>
                <a href="/contact" className="text-white/90 hover:text-white transition-colors duration-200">Contact</a>
               
                {/* Bell Icon moved to top header - smaller size */}
                <div className="hover:opacity-80 transition-opacity duration-200 p-2 rounded-full hover:bg-white/10">
                  <NotificationBell />
                </div>
               
                <div className="flex items-center space-x-3 text-white">
                  <a href="https://www.facebook.com/share/1KsXm99uAE/?mibextid=wwXIfr" className="hover:opacity-80 transition-opacity duration-200 p-2 rounded-full hover:bg-white/10"><FaFacebookF size={16} /></a>
                  <a href="https://www.instagram.com/riko.craft?igsh=YWlsZmRnNmk5eXp2" className="hover:opacity-80 transition-opacity duration-200 p-2 rounded-full hover:bg-white/10"><FaInstagram size={16} /></a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-[100px] md:h-[140px] gap-8">
            {/* Desktop Logo */}
            <motion.button 
              onClick={navigateToHome} 
              className="hidden md:block hover:scale-105 transition-transform duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img src={logo} alt="Riko Craft" className="h-24 w-auto drop-shadow-lg" />
            </motion.button>

            {/* Mobile Hamburger Menu - Left */}
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-white/90 hover:text-white transition-colors duration-200 p-2 rounded-lg hover:bg-white/10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>

            {/* Logo Image - Centered (Mobile Only) */}
            <div className="absolute left-1/2 transform -translate-x-1/2 md:hidden">
              <motion.button 
                onClick={navigateToHome} 
                className="hover:scale-105 transition-transform duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img src={logo} alt="Riko Craft" className="h-20 w-auto drop-shadow-lg" />
              </motion.button>
            </div>

            {/* Center Section - Search and Navigation */}
            <div className="hidden md:flex items-center flex-1 max-w-4xl mx-8 relative" ref={desktopSearchRef}>
              {/* Desktop Search */}
              <div className="flex-1 max-w-2xl relative">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsDesktopSearchFocused(true)}
                  className="w-full pl-6 pr-12 py-3 border-0 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 bg-white/20 backdrop-blur-sm text-white placeholder-white/70 shadow-lg"
                />
                <button 
                  type="submit" 
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors duration-200"
                >
                  <Search size={18} />
                </button>
              </form>
              
              {/* Desktop Search Results Dropdown */}
              {(isDesktopSearchFocused && searchQuery.trim()) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                >
                  {searchLoading && (
                    <div className="flex items-center justify-center py-8 text-[#772a4b]">
                      <Loader />
                    </div>
                  )}
                  {searchError && (
                    <div className="py-8 text-center text-red-500">{searchError}</div>
                  )}
                  {!searchLoading && !searchError && searchResults.length > 0 && (
                    <div className="p-2">
                      <div className="text-xs text-gray-400 px-4 py-2 border-b border-gray-100">
                        {searchResults.length} product{searchResults.length !== 1 ? 's' : ''} found
                      </div>
                      <ul>
                        {searchResults.slice(0, 6).map(product => (
                          <li
                            key={product._id}
                            className="flex items-center px-4 py-3 hover:bg-gray-50/80 cursor-pointer transition-all duration-200 rounded-lg mx-2 my-1"
                            onClick={() => handleResultClick(product._id)}
                          >
                            <img
                              src={config.fixImageUrl(product.image)}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg mr-3 border border-gray-200 shadow-sm flex-shrink-0"
                              onError={e => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/48x48/e2e8f0/475569?text=Product';
                              }}
                              loading="lazy"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate text-sm">{product.name}</div>
                              <div className="text-xs text-gray-500 line-clamp-2 leading-relaxed mt-1">{product.description}</div>
                            </div>
                            <div className="ml-3 text-[#772a4b] font-bold whitespace-nowrap text-sm">₹{product.price}</div>
                          </li>
                        ))}
                      </ul>
                      {searchResults.length > 6 && (
                        <div className="border-t border-gray-100 px-4 py-3">
                          <button
                            onClick={() => {
                              navigate('/shop', { state: { searchQuery } });
                              setIsDesktopSearchFocused(false);
                              setSearchResults([]);
                              setSearchQuery('');
                            }}
                            className="w-full text-center text-sm text-[#772a4b] hover:text-[#8f3a61] font-medium py-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                          >
                            View all {searchResults.length} results →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {!searchLoading && !searchError && searchQuery && searchResults.length === 0 && (
                    <div className="py-8 text-center text-gray-500">
                      <div className="text-sm">No products found for "{searchQuery}"</div>
                      <div className="text-xs text-gray-400 mt-1">Try different keywords</div>
                    </div>
                  )}
                </motion.div>
              )}
              </div>

              {/* Desktop Navigation - Moved to right side of search */}
              <nav className="hidden lg:flex items-center ml-2 space-x-4">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`text-sm font-medium transition-all duration-200 relative group ${
                      isActive(item.path)
                        ? 'text-white'
                        : 'text-white/90 hover:text-white'
                    }`}
                  >
                    {item.name}
                    <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-200 group-hover:w-full ${
                      isActive(item.path) ? 'w-full' : ''
                    }`}></span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Desktop Icons */}
            <div className="hidden md:flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Link to="/wishlist" className="text-white/90 hover:text-white transition-colors duration-200 relative p-2 rounded-full">
                  <Heart size={22} />
                  {getWishlistCount && getWishlistCount() > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-white text-[#772a4b] text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg"
                    >
                      {getWishlistCount()}
                    </motion.span>
                  )}
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Link to="/cart" className="text-white/90 transition-colors duration-200 relative p-2 rounded-full">
                  <ShoppingCart size={22} />
                  {getTotalItems && getTotalItems() > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-white text-[#772a4b] text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg"
                    >
                      {getTotalItems()}
                    </motion.span>
                  )}
                </Link>
              </motion.div>
              {user ? (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    to="/account" 
                    className="flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-2xl hover:bg-white/30 transition-all duration-200 shadow-lg border border-white/20"
                  >
                    My Account
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    to="/login" 
                    className="flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-2xl hover:bg-white/30 transition-all duration-200 shadow-lg border border-white/20"
                  >
                    Login / Register
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Mobile Right Section - Notifications, Wishlist and Search */}
            <div className="md:hidden flex items-center space-x-1 ml-36">
              {/* Mobile Notification Bell */}
              <NotificationBell />
              
              {/* Mobile Wishlist Icon */}
              <motion.button
                onClick={() => navigate('/wishlist')}
                className="text-white/90 hover:text-white transition-colors duration-200 p-1.5 rounded-lg hover:bg-white/10 relative"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="View wishlist"
              >
                <Heart size={24} />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {wishlistItems.length}
                  </span>
                )}
              </motion.button>
              
              <motion.button
                onClick={handleSearchIconClick}
                className="text-white/90 hover:text-white transition-colors duration-200 p-1.5 rounded-lg hover:bg-white/10"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Open search"
              >
                <Search size={24} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* New Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[20000]"
              />
              
              {/* Menu Panel */}
              <motion.div
                variants={mobileMenuVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="fixed top-0 left-0 h-full w-full max-w-sm bg-gradient-to-br from-[#772a4b] to-[#8f3a61] z-[20001] flex flex-col shadow-2xl"
              >
                {/* Menu Header with Close Button */}
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                    <img src={logo} alt="Riko Craft" className="h-12 w-auto drop-shadow-lg" />
                  </Link>
                  <motion.button 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="p-2 text-white hover:bg-white/10 rounded-full transition-colors duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={24} />
                  </motion.button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-white/20">
                  <button
                    onClick={() => setActiveMobileTab('menu')}
                    className={`flex-1 py-4 text-center text-sm font-semibold transition-all duration-200 ${
                      activeMobileTab === 'menu'
                        ? 'text-white border-b-2 border-white'
                        : 'text-white/70'
                    }`}
                  >
                    MENU
                  </button>
                  <button
                    onClick={() => setActiveMobileTab('categories')}
                    className={`flex-1 py-4 text-center text-sm font-semibold transition-all duration-200 ${
                      activeMobileTab === 'categories'
                        ? 'text-white border-b-2 border-white'
                        : 'text-white/70'
                    }`}
                  >
                    CATEGORIES
                  </button>
                </div>

                {/* Menu Content */}
                <div className="flex-grow overflow-y-auto">
                  {/* Menu Tab */}
                  {activeMobileTab === 'menu' && (
                    <div className="p-6 space-y-2">
                      {/* Navigation Links */}
                      <nav>
                        <ul className="space-y-2">
                          {MmenuItems.map((item) => (
                            <li key={item.path}>
                              <Link
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block py-4 px-6 rounded-xl text-white/90 hover:bg-white/10 hover:text-white transition-all duration-200 font-medium"
                              >
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </nav>
                    </div>
                  )}

                  {/* Categories Tab */}
                  {activeMobileTab === 'categories' && (
                    <div className="p-6">
                      {categoriesLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader />
                        </div>
                      ) : dynamicCategories.length > 0 ? (
                        <ul className="space-y-2">
                          {dynamicCategories.map(category => (
                            <li key={category._id || category.id} className="space-y-2">
                              {/* Main Category */}
                              <div className="flex items-center">
                              <button 
                                onClick={() => {
                                    if (category.subCategories && category.subCategories.length > 0) {
                                      toggleMobileCategory(category.name);
                                    } else {
                                  handleCategoryClick(category.name);
                                  setIsMobileMenuOpen(false);
                                    }
                                }}
                                  className="flex-1 text-left py-4 px-6 rounded-xl text-white/90 hover:bg-white/10 hover:text-white transition-all duration-200 font-medium"
                              >
                                {category.name}
                              </button>
                              
                                {/* Expand/Collapse Icon */}
                              {category.subCategories && category.subCategories.length > 0 && (
                                  <button
                                    onClick={() => toggleMobileCategory(category.name)}
                                    className="p-2 text-white/70 hover:text-white transition-colors duration-200"
                                  >
                                    <svg
                                      className={`w-5 h-5 transform transition-transform duration-200 ${
                                        expandedMobileCategories[category.name] ? 'rotate-180' : ''
                                      }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              
                              {/* Sub-Categories - Only show when expanded */}
                              {category.subCategories && category.subCategories.length > 0 && expandedMobileCategories[category.name] && (
                                <ul className="ml-4 space-y-1">
                                  {category.subCategories.map(subCategory => (
                                    <li key={subCategory._id || subCategory.id}>
                                      <button 
                                        onClick={() => {
                                          handleCategoryClick(category.name, subCategory.name);
                                          setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full text-left py-2 px-4 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-all duration-200 text-sm"
                                      >
                                        • {subCategory.name}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-12 text-white/60">
                          No categories available
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Menu Footer */}
                <div className="p-6 border-t border-white/20">
                  {user ? (
                    <Link
                      to="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-3 px-6 rounded-xl text-white/90 hover:bg-white/10 hover:text-white transition-all duration-200 font-medium"
                    >
                      <User size={20} /> My Account
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-3 px-6 rounded-xl text-white/90 hover:bg-white/10 hover:text-white transition-all duration-200 font-medium"
                    >
                      <User size={20} /> Login / Register
                    </Link>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#772a4b] to-[#8f3a61] border-t border-white/20 z-[20000] backdrop-blur-md shadow-lg">
        <nav className="flex justify-around items-center h-16 px-1">
          <Link to="/" className="flex flex-col items-center justify-center text-white/90 hover:text-white transition-colors duration-200 py-2">
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Home</span>
          </Link>
          <Link to="/shop" className="flex flex-col items-center justify-center text-white/90 hover:text-white transition-colors duration-200 py-2">
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Shop</span>
          </Link>
          <Link to="/blogs" className="flex flex-col items-center justify-center text-white/90 hover:text-white transition-colors duration-200 py-2">
            <BookOpen className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Blog</span>
          </Link>
          <Link to="/cart" className="flex flex-col items-center justify-center text-white/90 hover:text-white transition-colors duration-200 relative py-2">
            <ShoppingBag className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Cart</span>
            {getTotalItems && getTotalItems() > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-white text-[#772a4b] text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg"
              >
                {getTotalItems()}
              </motion.span>
            )}
          </Link>
          <Link to="/account" className="flex flex-col items-center justify-center text-white/90 hover:text-white transition-colors duration-200">
            <User className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Account</span>
          </Link>
        </nav>
      </div>
    </>
  );
};

export default Header;
