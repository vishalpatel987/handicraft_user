import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import config from '../../config/config.js';
import { categories as staticCategories } from '../../data/categories.js';
import ProductCard from '../ProductCard/ProductCard.jsx';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import userActivityService from '../../services/userActivityService';
import { cachedFetch } from '../../services/dataCacheService';

const containerVariants = {
  hidden: {},
  visible: {
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

// Static category images mapping
const categoryImages = {
  "Wooden Craft": "/images/categories/wooden-craft.jpg",
  "Terracotta Items": "/images/categories/terracotta.jpg", 
  "Dokra Art": "/images/categories/dokra-art.jpg",
  "Handmade Jewellery": "/images/categories/jewellery.jpg"
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  // Memoize displayed products to prevent unnecessary re-renders
  const displayedProducts = useMemo(() => {
    // For desktop view, limit to 2 rows (10 products) in handpicked collection
    // For mobile view, limit to 4 products
    return isMobile ? products.slice(0, 4) : products.slice(0, 10);
  }, [products, isMobile]);

  // Check if there are more products to show
  const hasMoreProducts = isMobile ? products.length > 4 : products.length > 10;

  const fetchCategories = async () => {
    try {
      // Fetch category hierarchy with sub-categories
      const response = await axios.get(`${config.API_URLS.CATEGORIES}/hierarchy`);
      const apiCategories = response.data.categories || [];
      
      console.log('Fetched categories with hierarchy:', apiCategories);
      
      // Process categories to handle both image and video fields, including sub-categories
      const processedCategories = apiCategories.map(category => ({
        id: category._id || category.id,
        name: category.name,
        description: category.description,
        // Prioritize video over image, fallback to static images
        image: category.video || category.image || categoryImages[category.name] || '/images/categories/default.jpg',
        isVideo: !!category.video,
        sortOrder: category.sortOrder || 0,
        // Include sub-categories
        subCategories: category.subCategories ? category.subCategories.map(sub => ({
          id: sub._id || sub.id,
          name: sub.name,
          description: sub.description,
          image: sub.video || sub.image || '/images/categories/default.jpg',
          isVideo: !!sub.video,
          sortOrder: sub.sortOrder || 0
        })) : []
      }));
      
      // Sort by sortOrder if available
      processedCategories.sort((a, b) => a.sortOrder - b.sortOrder);
      
      setCategories(processedCategories);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to static categories
      const fallbackCategories = staticCategories.map(category => ({
        id: category.name.toLowerCase().replace(/\s+/g, '-'),
        name: category.name,
        image: categoryImages[category.name] || '/images/categories/default.jpg',
        isVideo: false,
        subCategories: []
      }));
      setCategories(fallbackCategories);
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(config.API_URLS.SHOP);
      const allProducts = Array.isArray(response.data) ? response.data : response.data.products || [];
      
      // Fetch categories to add category names to products
      try {
        const categoriesResponse = await axios.get(`${config.API_URLS.CATEGORIES}/hierarchy`);
        const apiCategories = categoriesResponse.data.categories || [];
        
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
        const productsWithCategoryNames = allProducts.map(product => ({
          ...product,
          categoryName: categoryIdToName[product.category] || product.category,
          subCategoryName: product.subCategory ? (categoryIdToName[product.subCategory] || product.subCategory) : null
        }));
        
        // Get a mix of featured, best seller, and most loved products
        const featuredProducts = productsWithCategoryNames.filter(product => product.isFeatured);
        const bestSellerProducts = productsWithCategoryNames.filter(product => product.isBestSeller);
        const mostLovedProducts = productsWithCategoryNames.filter(product => product.isMostLoved);
        
        // Combine all special products and remove duplicates
        const mixedProducts = [...featuredProducts, ...bestSellerProducts, ...mostLovedProducts]
          .filter((product, index, self) => self.findIndex(p => p._id === product._id) === index);
        
        // If we have less than 4 products, add some regular products to make it 4
        let finalProducts = mixedProducts;
        if (mixedProducts.length < 4) {
          const regularProducts = productsWithCategoryNames
            .filter(product => !product.isFeatured && !product.isBestSeller && !product.isMostLoved)
            .slice(0, 4 - mixedProducts.length);
          finalProducts = [...mixedProducts, ...regularProducts];
        }
        
        // If still no products, show all available products
        if (finalProducts.length === 0) {
          finalProducts = productsWithCategoryNames;
        }
        
        // Show all products in handpicked collection (no limit)
        // finalProducts = finalProducts.slice(0, 6); // Removed limit to show all products
        
        console.log('📊 Handpicked Collection Products:', {
          totalProducts: allProducts.length,
          featuredProducts: featuredProducts.length,
          bestSellerProducts: bestSellerProducts.length,
          mostLovedProducts: mostLovedProducts.length,
          mixedProducts: mixedProducts.length,
          finalProducts: finalProducts.length,
          isMobile: isMobile,
          products: finalProducts.map(p => ({ name: p.name, isFeatured: p.isFeatured, isBestSeller: p.isBestSeller, isMostLoved: p.isMostLoved }))
        });
        
        setProducts(finalProducts);
      } catch (error) {
        console.error('Error fetching categories for products:', error);
        // Fallback without category names
        const featuredProducts = allProducts.filter(product => product.isFeatured);
        const bestSellerProducts = allProducts.filter(product => product.isBestSeller);
        const mostLovedProducts = allProducts.filter(product => product.isMostLoved);
        
        const mixedProducts = [...featuredProducts, ...bestSellerProducts, ...mostLovedProducts]
          .filter((product, index, self) => self.findIndex(p => p._id === product._id) === index);
        
        // If we have less than 4 products, add some regular products to make it 4
        let finalProducts = mixedProducts;
        if (mixedProducts.length < 4) {
          const regularProducts = allProducts
            .filter(product => !product.isFeatured && !product.isBestSeller && !product.isMostLoved)
            .slice(0, 4 - mixedProducts.length);
          finalProducts = [...mixedProducts, ...regularProducts];
        }
        
        // Limit to maximum 6 products
        finalProducts = finalProducts.slice(0, 6);
        
        setProducts(finalProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  if (loading) {
    return (
      <div className="py-8 md:py-16">
        <SkeletonLoader type="category-grid" count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 md:py-16">
        <div className="text-red-500 text-lg font-medium">{error}</div>
      </div>
    );
  }

  return (
    <section className="py-6 md:py-10 lg:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6 md:mb-8 lg:mb-10"
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-light tracking-tight text-gray-900 mb-3 md:mb-4">
              <span className="font-serif italic">Our Categories</span>
            </h2>
            <p className="text-gray-600 text-sm md:text-base lg:text-lg leading-relaxed mb-4 md:mb-6 max-w-2xl mx-auto">
              Discover our carefully curated collection of handcrafted treasures, each piece telling a unique story of craftsmanship and tradition
            </p>
            <div className="w-16 md:w-20 h-0.5 bg-[#8f3a61] mx-auto"></div>
          </div>
        </motion.div>

        {/* Main Categories Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8 max-w-6xl mx-auto"
        >
          {categories.map((category, index) => (
            <div key={category.id || index} className="space-y-4">
              {/* Main Category */}
              <Link
                to="/shop"
                state={{ selectedCategory: { main: category.name } }}
                className="group block"
                onClick={() => {
                  // Track category visit
                  userActivityService.trackCategoryVisit(category.id, null);
                }}
              >
                <motion.div
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                  className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 aspect-square"
                >
                  {/* Category Title - Above Image */}
                  <div className="absolute top-0 left-0 right-0 z-10 p-3 bg-gradient-to-b from-black/80 to-transparent">
                    <h3 className="text-sm font-semibold text-white text-center line-clamp-2 leading-tight">
                      {category.name}
                    </h3>
                  </div>

                  {/* Image/Video Container */}
                  <div className="relative w-full h-full overflow-hidden">
                    {category.isVideo ? (
                      <video
                        src={config.fixImageUrl(category.image)}
                        alt={category.name}
                        className="w-full h-full object-cover object-center transform group-hover:scale-110 transition-transform duration-500"
                        autoPlay
                        muted
                        loop
                        playsInline
                        onError={e => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/400x400/e2e8f0/475569?text=' + encodeURIComponent(category.name);
                        }}
                      />
                    ) : (
                      <img
                        src={config.fixImageUrl(category.image)}
                        alt={category.name}
                        className="w-full h-full object-cover object-center transform group-hover:scale-110 transition-transform duration-500"
                        onError={e => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/400x400/e2e8f0/475569?text=' + encodeURIComponent(category.name);
                        }}
                      />
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Bottom Overlay with Explore Text */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs text-white font-medium">
                          Explore
                        </span>
                        <svg 
                          className="w-3 h-3 text-white group-hover:translate-x-0.5 transition-transform duration-200" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Hover Effect Border */}
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-pink-200 rounded-2xl transition-colors duration-300 pointer-events-none" />
                </motion.div>
              </Link>


            </div>
          ))}
        </motion.div>

        {/* Products Preview Section */}
        {products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 md:mt-16 lg:mt-20"
          >
            {/* Section Header */}
            <div className="text-center mb-8 md:mb-10">
              <h3 className="text-xl md:text-2xl lg:text-3xl font-light tracking-tight text-gray-900 mb-3">
                <span className="font-serif italic">Our Handpicked Collection</span>
              </h3>
              <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
                Discover our carefully selected mix of featured, best-selling, and most-loved handcrafted pieces
              </p>
              <div className="w-16 md:w-20 h-0.5 bg-[#8f3a61] mx-auto mt-4"></div>
            </div>

            {/* Products Grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 max-w-7xl mx-auto mb-8 md:mb-10"
            >
              {displayedProducts.map((product, index) => (
                <motion.div key={product._id || product.id || `handpicked-${index}`} variants={itemVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>


            {/* View All Products CTA - Show when there are more products */}
            {hasMoreProducts && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="max-w-md mx-auto">
                  <p className="text-gray-600 text-sm md:text-base mb-4 md:mb-6">
                    Ready to explore our complete collection?
                  </p>
                  <Link
                    to="/shop"
                    className="inline-flex items-center px-6 md:px-8 py-3 md:py-4 bg-[#8f3a61] text-white font-medium rounded-lg hover:bg-pink-700 transition-all duration-300 group shadow-lg hover:shadow-xl"
                  >
                    View All Products
                    <svg 
                      className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Categories;