import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Grid, List, Home, ChevronRight } from 'lucide-react';
import axios from 'axios';
import config from '../config/config.js';
import ProductCard from '../components/ProductCard/ProductCard.jsx';
import Loader from '../components/Loader';
import SkeletonLoader from '../components/SkeletonLoader/SkeletonLoader';
import { trackCategoryVisit } from '../services/userActivityService';
import { parallelFetch } from '../services/dataCacheService';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

const SubCategoryPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [expandedSubCategories, setExpandedSubCategories] = useState(false);

  useEffect(() => {
    if (categoryId) {
      fetchCategoryData();
    }
  }, [categoryId]);

  // Handle subcategory from URL parameter
  useEffect(() => {
    const subcategoryParam = searchParams.get('subcategory');
    if (subcategoryParam && subCategories.length > 0) {
      const subCategory = subCategories.find(sub => sub._id === subcategoryParam);
      if (subCategory) {
        setSelectedSubCategory(subCategory);
        // Track sub-category visit from URL
        trackCategoryVisit(categoryId, subCategory._id);
        handleSubCategoryClick(subCategory);
      }
    }
  }, [searchParams, subCategories, categoryId]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Parallel fetch category details, subcategories, and products
      const [categoryResult, subCategoriesResult, productsResult] = await parallelFetch([
        { url: `${config.API_URLS.CATEGORIES}/${categoryId}` },
        { url: `${config.API_URLS.CATEGORIES}/sub/${categoryId}` },
        { url: config.API_URLS.SHOP }
      ]);

      if (!categoryResult.success) {
        throw new Error('Failed to fetch category details');
      }

      const categoryData = categoryResult.data.category;
      setCategory(categoryData);

      if (subCategoriesResult.success) {
        const subCategoriesData = subCategoriesResult.data.subCategories || [];
      setSubCategories(subCategoriesData);
      }

      if (productsResult.success) {
        const allProducts = Array.isArray(productsResult.data) ? productsResult.data : productsResult.data.products || [];
      
      // Filter products by category
      const categoryProducts = allProducts.filter(product => 
        product.category === categoryId || 
        (product.category && product.category._id === categoryId) ||
        (product.category && product.category === categoryData.name)
      );
      
      setProducts(categoryProducts);
      setFilteredProducts(categoryProducts);
      }
      
      // Track category visit
      trackCategoryVisit(categoryId, null);
      
    } catch (error) {
      console.error('Error fetching category data:', error);
      setError('Failed to load category data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubCategoryClick = (subCategory) => {
    setSelectedSubCategory(subCategory);
    
    // Track sub-category visit
    trackCategoryVisit(categoryId, subCategory._id);
    
    // Filter products by subcategory
    const subCategoryProducts = products.filter(product => 
      product.subCategory === subCategory._id || 
      (product.subCategory && product.subCategory._id === subCategory._id) ||
      (product.subCategory && product.subCategory === subCategory.name)
    );
    
    setFilteredProducts(subCategoryProducts);
  };

  const handleShowAllProducts = () => {
    setSelectedSubCategory(null);
    setFilteredProducts(products);
  };

  const toggleSubCategories = () => {
    setExpandedSubCategories(!expandedSubCategories);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          <SkeletonLoader type="page" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-4">{error}</div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-lg font-medium mb-4">Category not found</div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link to="/" className="flex items-center space-x-1 hover:text-gray-700 transition-colors">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/shop" className="hover:text-gray-700 transition-colors">
              Shop
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{category.name}</span>
            {selectedSubCategory && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 font-medium">{selectedSubCategory.name}</span>
              </>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {selectedSubCategory ? selectedSubCategory.name : category.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  {selectedSubCategory ? selectedSubCategory.description : category.description}
                </p>
              </div>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Subcategories */}
          {subCategories.length > 0 && (
            <div className="lg:w-1/4">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                  Subcategories
                </h2>
                  <button
                    onClick={toggleSubCategories}
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label={expandedSubCategories ? "Collapse subcategories" : "Expand subcategories"}
                  >
                    <svg
                      className={`w-5 h-5 transform transition-transform duration-200 ${
                        expandedSubCategories ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                {/* Show All Products Button */}
                <button
                  onClick={handleShowAllProducts}
                  className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                    !selectedSubCategory
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Products ({products.length})
                </button>
                
                {/* Subcategories List - Only show when expanded */}
                {expandedSubCategories && (
                <div className="space-y-2">
                  {subCategories.map((subCategory) => (
                    <button
                      key={subCategory._id}
                      onClick={() => handleSubCategoryClick(subCategory)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedSubCategory && selectedSubCategory._id === subCategory._id
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{subCategory.name}</span>
                        <span className="text-sm text-gray-500">
                          {products.filter(product => 
                            product.subCategory === subCategory._id || 
                            (product.subCategory && product.subCategory._id === subCategory._id) ||
                            (product.subCategory && product.subCategory === subCategory.name)
                          ).length}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content - Products */}
          <div className="lg:w-3/4">
            {/* Selected Subcategory Info */}
            {selectedSubCategory && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedSubCategory.name}
                </h2>
                <p className="text-gray-600">{selectedSubCategory.description}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {filteredProducts.length} products found
                </p>
              </div>
            )}

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={`grid gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1'
                }`}
              >
                {filteredProducts.map((product, index) => (
                  <motion.div key={product._id || product.id || index} variants={itemVariants}>
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-gray-500 text-lg font-medium mb-4">
                  No products found
                </div>
                <p className="text-gray-400 mb-6">
                  {selectedSubCategory 
                    ? `No products available in ${selectedSubCategory.name}`
                    : `No products available in ${category.name}`
                  }
                </p>
                <Link
                  to="/shop"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse All Products
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubCategoryPage;
