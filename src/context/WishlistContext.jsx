import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import wishlistService from '../services/wishlistService';
import { toast } from 'react-hot-toast';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  // Load wishlist from backend
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        if (isAuthenticated && user && user.email) {
          const data = await wishlistService.getWishlist(user.email);
          setWishlistItems(data.wishlist?.products || []);
        } else {
          setWishlistItems([]);
        }
      } catch (error) {
        console.error('Error loading wishlist:', error);
      } finally {
        setLoading(false);
      }
    };
    loadWishlist();
  }, [isAuthenticated, user]);

  const addToWishlist = async (productId) => {
    try {
      console.log('🔔 Adding to wishlist:', { productId, user: user?.email, isAuthenticated });
      
      if (!isAuthenticated) {
        toast.error('Please sign in to add items to wishlist');
        return;
      }

      if (isAuthenticated && user && user.email) {
        console.log('📤 Sending wishlist request:', { email: user.email, productId });
        const data = await wishlistService.addToWishlist(user.email, productId);
        console.log('✅ Wishlist response:', data);
        setWishlistItems(data.wishlist?.products || []);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('❌ Wishlist error:', error);
      console.error('Error details:', error.response?.data);
      if (error.response?.data?.message === 'Product already in wishlist') {
        toast.error('Product already in wishlist');
      } else {
        toast.error(error.response?.data?.message || 'Failed to add to wishlist');
      }
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      if (!isAuthenticated) {
        toast.error('Please sign in to manage your wishlist');
        return;
      }

      if (isAuthenticated && user && user.email) {
        const data = await wishlistService.removeFromWishlist(user.email, productId);
        setWishlistItems(data.wishlist?.products || []);
        toast.success('Removed from wishlist');
      }
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    }
  };

  const clearWishlist = async () => {
    try {
      if (!isAuthenticated) {
        toast.error('Please sign in to manage your wishlist');
        return;
      }

      if (isAuthenticated && user && user.email) {
        await wishlistService.clearWishlist(user.email);
        setWishlistItems([]);
        toast.success('Wishlist cleared');
      }
    } catch (error) {
      toast.error('Failed to clear wishlist');
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(
      item => (item.product?._id || item.product?.id) === productId
    );
  };

  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  const getWishlistCount = () => {
    return wishlistItems.length;
  };

  const value = {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
    toggleWishlist,
    getWishlistCount
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

