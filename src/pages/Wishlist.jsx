import React from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon, ShoppingCartIcon, XMarkIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import config from '../config/config';
import Loader from '../components/Loader';

const Wishlist = () => {
  const { wishlistItems, removeFromWishlist, clearWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId);
      toast.success('Added to cart successfully!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      try {
        await clearWishlist();
      } catch (error) {
        console.error('Error clearing wishlist:', error);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Link to="/">
              <img src="/logo.png" alt="Riko Craft" className="mx-auto h-20 w-auto mb-3" />
            </Link>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">My Wishlist</h2>
          </div>

          <div className="bg-white shadow-lg rounded-2xl p-8">
            <div className="text-center py-12">
              <HeartIcon className="mx-auto h-16 w-16 text-pink-500 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Please sign in</h3>
              <p className="text-gray-600 mb-6">Sign in to view and manage your wishlist</p>
              <Link
                to="/login"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size="md" text="Loading wishlist..." />
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Link to="/">
              <img src="/logo.png" alt="Riko Craft" className="mx-auto h-20 w-auto mb-3" />
            </Link>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">My Wishlist</h2>
          </div>

          <div className="bg-white shadow-lg rounded-2xl p-8">
            <div className="text-center py-12">
              <HeartIcon className="mx-auto h-16 w-16 text-pink-500 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
              <p className="text-gray-600 mb-6">Add items to your wishlist to save them for later</p>
              <Link
                to="/shop"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 transition-colors"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <HeartIconSolid className="h-8 w-8 text-pink-600" />
              My Wishlist
            </h1>
            <p className="text-gray-600 mt-1">{wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}</p>
          </div>
          
          {wishlistItems.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
            >
              <TrashIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Clear All</span>
            </motion.button>
          )}
        </div>

        {/* Wishlist Grid - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {wishlistItems.map((item) => {
            const product = item.product;
            if (!product) return null;


            const mainImage = product.images && product.images.length > 0 
              ? config.fixImageUrl(product.images[0]) 
              : config.fixImageUrl(product.image);

            return (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="group relative bg-white rounded-xl overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 shadow-sm border border-gray-100"
              >
                {/* Remove Button */}
                <button
                  onClick={() => handleRemove(product._id || product.id)}
                  className="absolute top-2 right-2 z-20 w-7 h-7 sm:w-8 sm:h-8 bg-white/95 hover:bg-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-all duration-200"
                  aria-label="Remove from wishlist"
                >
                  <XMarkIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 hover:text-red-600" />
                </button>

                <Link to={`/product/${product._id || product.id}`} className="block">
                  {/* Product Image */}
                  <div className="relative aspect-[4/3.5] w-full overflow-hidden bg-gray-50">
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="w-full h-full object-cover object-center transition-transform duration-300 ease-in-out group-hover:scale-105"
                      onError={e => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/400x500/e2e8f0/475569?text=Image';
                      }}
                    />
                    
                    {/* Discount Badge */}
                    {product.regularPrice && product.regularPrice > product.price && (
                      <div className="absolute top-2 left-2 bg-[#8f3a61] text-white px-2 py-1 rounded-md text-xs font-semibold shadow-lg">
                        -{Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)}%
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3 sm:p-4 space-y-2">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 line-clamp-2 group-hover:text-[#8f3a61] transition-colors leading-tight">
                      {product.name || product.title || product.productName || 'Product Name'}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 leading-tight line-clamp-1">
                      {product.category?.name || 
                       product.subCategory?.name || 
                       product.categoryName || 
                       product.subCategoryName || 
                       (typeof product.category === 'string' && !product.category.match(/^[0-9a-fA-F]{24}$/) ? product.category : null) ||
                       (typeof product.subCategory === 'string' && !product.subCategory.match(/^[0-9a-fA-F]{24}$/) ? product.subCategory : null) ||
                       'Category'}
                    </p>
                    <div className="flex items-baseline justify-between pt-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base sm:text-lg font-bold text-[#8f3a61]">
                          ₹{Math.round(product.price)}
                        </span>
                        {product.regularPrice && product.regularPrice > product.price && (
                          <span className="text-xs sm:text-sm text-gray-400 line-through">
                            ₹{Math.round(product.regularPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Add to Cart Button */}
                <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAddToCart(product._id || product.id)}
                    disabled={product.stock === 0 || product.stock <= 0}
                    className={`w-full font-semibold py-2.5 sm:py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ease-in-out text-sm sm:text-base ${
                      product.stock === 0 || product.stock <= 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[#8f3a61] text-white hover:bg-[#8f3a61]/90 shadow-md hover:shadow-lg'
                    }`}
                  >
                    <ShoppingCartIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    {product.stock === 0 || product.stock <= 0 ? 'Out of Stock' : 'Add to cart'}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Continue Shopping */}
        <div className="mt-12 text-center">
          <Link
            to="/shop"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#8f3a61] hover:bg-[#8f3a61]/90 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
