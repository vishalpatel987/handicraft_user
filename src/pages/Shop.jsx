import { useState, useEffect } from 'react';
import { useLocation, Link, useSearchParams } from 'react-router-dom';
import { Slider } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartIcon, ShoppingCartIcon, EyeIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
// import { products } from '../data/products';
// import { categories } from '../data/categories';
import ProductCard from '../components/ProductCard/ProductCard.jsx';
import config from '../config/config.js';
import Loader from '../components/Loader';
import SkeletonLoader from '../components/SkeletonLoader/SkeletonLoader';
import { useCart } from '../context/CartContext';
import { trackCategoryVisit } from '../services/userActivityService';
import { cachedFetch, parallelFetch } from '../services/dataCacheService';

const Shop = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { setSellerTokenFromURL } = useCart();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [selectedCategories, setSelectedCategories] = useState({
    main: null,
    sub: null,
    item: null
  });
  const [expandedCategories, setExpandedCategories] = useState({});
  const [sortBy, setSortBy] = useState('price-low');
  const [viewMode, setViewMode] = useState(16);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Handle body scroll lock when mobile filters are open
  useEffect(() => {
    if (isMobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileFiltersOpen]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dynamicCategories, setDynamicCategories] = useState([]);

  // Handle seller token from URL
  useEffect(() => {
    const sellerToken = searchParams.get('seller');
    if (sellerToken) {
      setSellerTokenFromURL(sellerToken);
    }
  }, [searchParams, setSellerTokenFromURL]);

  // Handle category and subcategory from query param (for footer links)
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const subcategoryParam = searchParams.get('subcategory');
    const filterParam = searchParams.get('filter');
    
    if (categoryParam) {
      setSelectedCategories({ 
        main: categoryParam, 
        sub: subcategoryParam || null, 
        item: null 
      });
      setExpandedCategories(prev => ({ ...prev, [categoryParam]: true }));
      
      // Track category/sub-category visit from URL
      const selectedCategory = dynamicCategories.find(cat => cat.name === categoryParam);
      if (selectedCategory) {
        trackCategoryVisit(selectedCategory.id, subcategoryParam || null);
      }
      
      if (subcategoryParam) {
        console.log('🔍 Setting subcategory from URL:', subcategoryParam);
      }
    }
    
    // Handle filter parameter for specific product sections
    if (filterParam) {
      setSelectedCategories({ 
        main: null, 
        sub: null, 
        item: filterParam 
      });
    }
  }, [searchParams, dynamicCategories]);

  // Fetch products from backend with caching and parallel loading
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Parallel fetch products and categories
        const [productsResult, categoriesResult] = await parallelFetch([
          { url: config.API_URLS.SHOP },
          { url: `${config.API_URLS.CATEGORIES}/hierarchy` }
        ]);

        if (!productsResult.success) {
          throw new Error('Failed to fetch products');
        }

        const productsArray = Array.isArray(productsResult.data) ? productsResult.data : productsResult.data.products || [];
        
        // Process categories if available
        if (categoriesResult.success) {
          const apiCategories = categoriesResult.data.categories || [];
          
          // Create a map of category IDs to names
          const categoryIdToName = {};
          apiCategories.forEach(category => {
            categoryIdToName[category._id] = category.name;
            if (category.subCategories) {
              category.subCategories.forEach(subCategory => {
                categoryIdToName[subCategory._id] = subCategory.name;
              });
            }
          });
          
          // Add category names to products
          const productsWithCategoryNames = productsArray.map(product => ({
            ...product,
            categoryName: categoryIdToName[product.category] || product.category,
            subCategoryName: product.subCategory ? (categoryIdToName[product.subCategory] || product.subCategory) : null
          }));
          
          console.log('Products with category names:', productsWithCategoryNames.map(p => ({
            name: p.name,
            category: p.category,
            categoryName: p.categoryName,
            subCategory: p.subCategory,
            subCategoryName: p.subCategoryName
          })));
          
          setProducts(productsWithCategoryNames);
        } else {
          console.error('Error fetching categories for products:', categoriesResult.error);
          setProducts(productsArray);
        }
        
        // Calculate maximum price from products
        if (productsArray.length > 0) {
          const maxProductPrice = Math.max(...productsArray.map(product => product.price || 0));
          setMaxPrice(maxProductPrice);
          setPriceRange([0, maxProductPrice]);
        }
        
        // Fetch categories from API
        fetchCategories();
      } catch (err) {
        setError(err.message || 'Error fetching products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const categoriesResponse = await fetch(`${config.API_URLS.CATEGORIES}/hierarchy`);
      const categoriesData = await categoriesResponse.json();
      const apiCategories = categoriesData.categories || [];
      
      // Convert API categories to the format expected by the UI
      const categories = apiCategories.map(category => ({
        id: category._id,
        name: category.name,
        submenu: category.subCategories ? category.subCategories.map(sub => ({
          id: sub._id,
          name: sub.name,
          items: undefined // We'll add items later if needed
        })) : []
      }));
      
      setDynamicCategories(categories);
      console.log('Categories fetched:', categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setDynamicCategories([]);
    }
  };

  // Handle category selection from header dropdown
  useEffect(() => {
    if (location.state?.selectedCategory) {
      setSelectedCategories(location.state.selectedCategory);
      if (location.state.selectedCategory.main) {
        setExpandedCategories(prev => ({
          ...prev,
          [location.state.selectedCategory.main]: true
        }));
        
        // Track category/sub-category visit from location state
        const selectedCategory = dynamicCategories.find(cat => cat.name === location.state.selectedCategory.main);
        if (selectedCategory) {
          trackCategoryVisit(selectedCategory.id, location.state.selectedCategory.sub || null);
        }
      }
    }
  }, [location.state, dynamicCategories]);

  useEffect(() => {
    filterProducts();
  }, [products, priceRange, selectedCategories, sortBy]);

  const filterProducts = () => {
    let filtered = [...products];

    // Price filter
    filtered = filtered.filter(
      (product) => product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Filter by specific product sections (for mobile View More buttons)
    if (selectedCategories.item) {
      console.log('🔍 Filtering by product section:', selectedCategories.item);
      console.log('📊 Available products before filtering:', filtered.length);
      console.log('🔍 Sample product properties:', filtered[0] ? Object.keys(filtered[0]) : 'No products');
      
      switch (selectedCategories.item) {
        case 'most-loved':
          // Filter for most loved products - use more flexible criteria
          filtered = filtered.filter(product => 
            product.isMostLoved || product.featured || (product.rating && product.rating >= 4.0) || product.isPopular
          );
          console.log('💖 Most loved filter applied, products found:', filtered.length);
          break;
        case 'weekly-bestsellers':
          // Filter for weekly bestsellers - use more flexible criteria
          filtered = filtered.filter(product => 
            product.isWeeklyBestseller || product.featured || (product.salesCount && product.salesCount > 5) || product.isBestseller || product.isPopular
          );
          console.log('⭐ Weekly bestsellers filter applied, products found:', filtered.length);
          break;
        case 'featured':
          // Filter for featured products - use more flexible criteria
          filtered = filtered.filter(product => 
            product.featured || product.isFeatured || product.isPopular || product.isHighlighted
          );
          console.log('✨ Featured products filter applied, products found:', filtered.length);
          break;
        default:
          // No additional filtering for unknown filters
          break;
      }
      
      console.log('📊 Products after section filter:', filtered.length);
      
      // If no products found, show all products as fallback
      if (filtered.length === 0) {
        console.log('⚠️ No products found with specific filter, showing all products as fallback');
        filtered = [...products].filter(
          (product) => product.price >= priceRange[0] && product.price <= priceRange[1]
        );
      }
    }

    // Category filter
    if (selectedCategories.main) {
      console.log('🔍 Filtering by category:', selectedCategories.main);
      console.log('📊 Available products:', products.length);
      console.log('💰 Products after price filter:', filtered.length);
      
      filtered = filtered.filter(product => {
        // Match by category name or ID
        let categoryMatch = false;
        
        // Check if selectedCategories.main is a category name (from footer) or ID
        if (typeof selectedCategories.main === 'string') {
          // Check if it's a category name match
          if (product.categoryName && product.categoryName === selectedCategories.main) {
            categoryMatch = true;
          }
          // Check if it's a category ID match
          else if (product.category === selectedCategories.main) {
            categoryMatch = true;
          }
          // Check if it's a populated category object
          else if (product.category && typeof product.category === 'object' && product.category.name === selectedCategories.main) {
            categoryMatch = true;
          }
        }
        
        if (selectedCategories.item) {
          const itemMatch = categoryMatch && 
                 (product.subCategory === selectedCategories.sub || product.subCategoryName === selectedCategories.sub) &&
                 product.item === selectedCategories.item;
          if (itemMatch) console.log(`✅ ${product.name} matches item filter`);
          return itemMatch;
        }
        if (selectedCategories.sub) {
          const subMatch = categoryMatch && 
                 (product.subCategory === selectedCategories.sub || product.subCategoryName === selectedCategories.sub);
          if (subMatch) {
            console.log(`✅ ${product.name} matches subcategory filter:`, {
              productSubCategory: product.subCategory,
              productSubCategoryName: product.subCategoryName,
              selectedSub: selectedCategories.sub
            });
          } else {
            console.log(`❌ ${product.name} doesn't match subcategory filter:`, {
              productSubCategory: product.subCategory,
              productSubCategoryName: product.subCategoryName,
              selectedSub: selectedCategories.sub,
              categoryMatch
            });
          }
          return subMatch;
        }
        if (categoryMatch) console.log(`✅ ${product.name} matches main category filter`);
        return categoryMatch;
      });
      
      console.log('🎯 Products after category filter:', filtered.length);
    }

    // Sorting
    switch (sortBy) {
      case 'popularity':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'latest':
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  };

  const handlePriceChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const handleCategoryClick = (main, sub = null, item = null) => {
    console.log('🖱️ Category clicked:', main, sub, item);
    
    // Find the category ID from the category name
    const selectedCategory = dynamicCategories.find(cat => cat.name === main);
    const selectedSubCategory = sub ? selectedCategory?.submenu?.find(subCat => subCat.name === sub) : null;
    
    console.log('🔍 Found category:', selectedCategory);
    console.log('🔍 Found subcategory:', selectedSubCategory);
    
    // Track category/sub-category visit
    if (selectedCategory) {
      trackCategoryVisit(selectedCategory.id, selectedSubCategory?.id || null);
    }
    
    // Always set the selected category, don't toggle
    // Use category name for filtering (not ID) since our filter logic handles both
    const newSelection = {
      main: main, // Use category name directly for filtering
      sub: selectedSubCategory?.id || sub,
      item: item
    };
    
    console.log('✅ Setting selected categories:', newSelection);
    setSelectedCategories(newSelection);
  };

  const isCategorySelected = (main, sub = null, item = null) => {
    // Find the category ID from the category name
    const selectedCategory = dynamicCategories.find(cat => cat.name === main);
    const selectedSubCategory = sub ? selectedCategory?.submenu?.find(subCat => subCat.name === sub) : null;
    
    return selectedCategories.main === main && 
           (!sub || selectedCategories.sub === (selectedSubCategory?.id || sub)) && 
           (!item || selectedCategories.item === item);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <div className="min-h-screen py-12 relative">
      <div className="container mx-auto px-4">
        {/* Mobile Filter Button */}
        <div className="md:hidden mb-6">
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100 text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            <FunnelIcon className="h-5 w-5" />
            <span className="font-medium">Filters</span>
          </button>
        </div>

        {loading ? (
          <div className="w-full">
            <SkeletonLoader type="product-grid" count={12} isMobile={window.innerWidth < 768} />
          </div>
        ) : (
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Filters - Desktop */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden md:block w-64 space-y-6"
          >
            {/* Categories Filter */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {dynamicCategories.map((category) => (
                  <div key={category.name}>
                    <button
                      onClick={() => {
                        handleCategoryClick(category.name);
                        if (category.submenu?.length > 0) {
                          toggleCategory(category.name);
                        }
                      }}
                      className={`w-full text-left px-4 py-2 rounded-xl transition-all duration-300 flex items-center justify-between ${
                        isCategorySelected(category.name) 
                          ? 'bg-pink-600 text-white shadow-md' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>{category.name}</span>
                      {category.submenu?.length > 0 && (
                        <svg
                          className={`w-4 h-4 transform transition-transform duration-300 ${
                            expandedCategories[category.name] ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                    <AnimatePresence>
                    {expandedCategories[category.name] && category.submenu && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="ml-4 mt-2 space-y-2 overflow-hidden"
                        >
                        {category.submenu.map((sub) => (
                          <div key={sub.name}>
                            <button
                              onClick={() => {
                                handleCategoryClick(category.name, sub.name);
                                if (sub.items?.length > 0) {
                                  toggleCategory(sub.name);
                                }
                              }}
                                className={`w-full text-left px-4 py-2 rounded-xl transition-all duration-300 flex items-center justify-between ${
                                  isCategorySelected(category.name, sub.name) 
                                    ? 'bg-pink-600 text-white shadow-md' 
                                    : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <span>{sub.name}</span>
                              {sub.items?.length > 0 && (
                                <svg
                                    className={`w-4 h-4 transform transition-transform duration-300 ${
                                    expandedCategories[sub.name] ? 'rotate-180' : ''
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              )}
                            </button>
                              <AnimatePresence>
                            {expandedCategories[sub.name] && sub.items && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="ml-4 mt-2 space-y-2 overflow-hidden"
                                  >
                                {sub.items.map((item) => (
                                  <button
                                    key={item}
                                    onClick={() => handleCategoryClick(category.name, sub.name, item)}
                                        className={`w-full text-left px-4 py-2 rounded-xl transition-all duration-300 ${
                                          isCategorySelected(category.name, sub.name, item) 
                                            ? 'bg-pink-600 text-white shadow-md' 
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                  >
                                    {item}
                                  </button>
                                ))}
                                  </motion.div>
                            )}
                              </AnimatePresence>
                          </div>
                        ))}
                        </motion.div>
                    )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Range</h3>
              <Slider
                value={priceRange}
                onChange={handlePriceChange}
                valueLabelDisplay="auto"
                min={0}
                max={maxPrice}
                className="text-pink-600"
              />
              <div className="flex justify-between mt-2">
                <span className="text-sm text-gray-600">₹{priceRange[0].toLocaleString()}</span>
                <span className="text-sm text-gray-600">₹{priceRange[1].toLocaleString()}</span>
              </div>
            </div>

            {/* Sort By Filter */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sort By</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent transition-all duration-300"
              >
                <option value="popularity">Popularity</option>
                <option value="latest">Latest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>

            {/* Clear All Filters Button */}
            {(selectedCategories.main || priceRange[0] > 0 || priceRange[1] < maxPrice || sortBy !== 'price-low') && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedCategories({ main: null, sub: null, item: null });
                    setPriceRange([0, maxPrice]);
                    setSortBy('price-low');
                  }}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 transition-all duration-300 shadow-sm font-medium"
                >
                  Clear All Filters
                </motion.button>
              </div>
            )}

          </motion.div>

          {/* Mobile Filters Sidebar */}
          <AnimatePresence>
            {isMobileFiltersOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-[9999] md:hidden"
                  onClick={() => setIsMobileFiltersOpen(false)}
                />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="fixed right-0 top-0 h-full w-72 bg-white z-[10000] p-4 overflow-y-auto md:hidden shadow-2xl"
                >
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
                    <button
                      onClick={() => setIsMobileFiltersOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Close filters"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  {/* Mobile Filters Content */}
                  <div className="space-y-4">
                    {/* Categories Filter */}
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold text-gray-900">Categories</h3>
                      <div className="space-y-2">
                        {dynamicCategories.map((category) => (
                          <div key={category.name}>
                            <button
                              onClick={() => {
                                handleCategoryClick(category.name);
                                if (category.submenu?.length > 0) {
                                  toggleCategory(category.name);
                                } else {
                                  // Close mobile filter modal when category is selected
                                  setIsMobileFiltersOpen(false);
                                }
                              }}
                              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 flex items-center justify-between text-sm min-h-[44px] ${
                                isCategorySelected(category.name) 
                                  ? 'bg-pink-600 text-white shadow-md' 
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <span>{category.name}</span>
                              {category.submenu?.length > 0 && (
                                <svg
                                  className={`w-4 h-4 transform transition-transform duration-300 ${
                                    expandedCategories[category.name] ? 'rotate-180' : ''
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              )}
                            </button>
                            <AnimatePresence>
                              {expandedCategories[category.name] && category.submenu && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="ml-4 mt-2 space-y-2 overflow-hidden"
                                >
                                  {category.submenu.map((sub) => (
                                    <div key={sub.name}>
                                      <button
                                        onClick={() => {
                                          handleCategoryClick(category.name, sub.name);
                                          if (sub.items?.length > 0) {
                                            toggleCategory(sub.name);
                                          } else {
                                            // Close mobile filter modal when subcategory is selected
                                            setIsMobileFiltersOpen(false);
                                          }
                                        }}
                                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-between min-h-[44px] ${
                                          isCategorySelected(category.name, sub.name) 
                                            ? 'bg-pink-600 text-white shadow-md' 
                                            : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                      >
                                        <span>{sub.name}</span>
                                        {sub.items?.length > 0 && (
                                          <svg
                                            className={`w-4 h-4 transform transition-transform duration-300 ${
                                              expandedCategories[sub.name] ? 'rotate-180' : ''
                                            }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        )}
                                      </button>
                                      <AnimatePresence>
                                        {expandedCategories[sub.name] && sub.items && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="ml-4 mt-2 space-y-2 overflow-hidden"
                                          >
                                            {sub.items.map((item) => (
                                              <button
                                                key={item}
                                                onClick={() => {
                                                  handleCategoryClick(category.name, sub.name, item);
                                                  // Close mobile filter modal when item is selected
                                                  setIsMobileFiltersOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 min-h-[44px] ${
                                                  isCategorySelected(category.name, sub.name, item) 
                                                    ? 'bg-pink-600 text-white shadow-md' 
                                                    : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                              >
                                                {item}
                                              </button>
                                            ))}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price Range Filter */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Price Range</h3>
                      <Slider
                        value={priceRange}
                        onChange={handlePriceChange}
                        valueLabelDisplay="auto"
                        min={0}
                        max={maxPrice}
                        className="text-pink-600"
                      />
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">₹{priceRange[0].toLocaleString()}</span>
                        <span className="text-sm text-gray-600">₹{priceRange[1].toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Sort By Filter */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Sort By</h3>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent transition-all duration-300 min-h-[44px] text-base"
                      >
                        <option value="popularity">Popularity</option>
                        <option value="latest">Latest</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="alphabetical">Alphabetical</option>
                      </select>
                    </div>

                    {/* Clear All Filters Button */}
                    {(selectedCategories.main || priceRange[0] > 0 || priceRange[1] < maxPrice || sortBy !== 'price-low') && (
                      <div className="space-y-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedCategories({ main: null, sub: null, item: null });
                            setPriceRange([0, maxPrice]);
                            setSortBy('price-low');
                          }}
                          className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 transition-all duration-300 shadow-sm font-medium min-h-[44px] text-base"
                        >
                          Clear All Filters
                        </motion.button>
                      </div>
                    )}

                    {/* Apply Filters Button */}
                    <div className="pt-4 border-t border-gray-200">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsMobileFiltersOpen(false)}
                        className="w-full bg-gradient-to-r from-[#8f3a61] to-[#7a2f52] text-white px-4 py-3 rounded-xl hover:from-[#7a2f52] hover:to-[#6a2847] transition-all duration-300 shadow-lg hover:shadow-xl min-h-[44px] text-base font-semibold"
                      >
                        Apply Filters
                      </motion.button>
                    </div>

                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Products Grid */}
          <div id="products-section" className="flex-1">
              {error ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                <svg className="w-12 h-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path fill="currentColor" d="M15 9l-6 6m0-6l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-lg text-red-600">{error}</span>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Shop; 