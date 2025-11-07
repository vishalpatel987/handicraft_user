import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import cartService from '../services/cartService';
import { toast } from 'react-hot-toast';
import config from '../config/config';


const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  const { isAuthenticated, user } = useAuth();

  // Load cart from backend or localStorage
  useEffect(() => {
    const loadCart = async () => {
      try {
        if (isAuthenticated && user && user.email) {
          // Load from backend by email
          const cartData = await cartService.getCart(user.email);
          setCartItems(cartData.items || []);
        } else {
          // Load from localStorage
          const savedCart = localStorage.getItem('cart');
          if (savedCart) {
            try {
              const parsedCart = JSON.parse(savedCart);
              setCartItems(parsedCart);
            } catch (parseError) {
              console.error('Error parsing saved cart:', parseError);
              localStorage.removeItem('cart');
              setCartItems([]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };
    loadCart();
  }, [isAuthenticated, user]);

  // Save cart to localStorage whenever cartItems change
  useEffect(() => {
    if (!loading && cartItems.length >= 0) {
      if (cartItems.length === 0) {
        // Clear localStorage when cart is empty
        localStorage.removeItem('cart');
      } else {
        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cartItems));
      }
    }
  }, [cartItems, loading]);

  // Helper functions for sellerToken with 24-hour expiry
 

  // Save seller token to localStorage and update URL
 

  // Function to set seller token from URL and persist it
 
 

  const addToCart = async (productId, quantity = 1) => {
    try {
      if (!isAuthenticated) {
        toast.error('Please sign in to add items to cart');
        return;
      }

      if (isAuthenticated && user && user.email) {
        // Add to backend by email
        const updatedCart = await cartService.addToCart(productId, quantity, user.email);
        setCartItems(updatedCart.items);
        toast.success('Item added to cart');
      } else {
        // This should not happen if authentication is required, but keeping as fallback
        toast.error('Please sign in to add items to cart');
      }
    } catch (error) {
    
      toast.error('Failed to add item to cart');
    }
  };

  const removeFromCart = async (productId) => {
    try {
      if (!isAuthenticated) {
        toast.error('Please sign in to manage your cart');
        return;
      }

      if (isAuthenticated && user && user.email) {
        // Remove from backend by email
        const updatedCart = await cartService.removeFromCart(productId, user.email);
        setCartItems(updatedCart.items);
        toast.success('Item removed from cart');
      } else {
        toast.error('Please sign in to manage your cart');
      }
    } catch (error) {
     
      toast.error('Failed to remove item from cart');
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;
    try {
      if (!isAuthenticated) {
        toast.error('Please sign in to manage your cart');
        return;
      }

      if (isAuthenticated && user && user.email) {
        // Update in backend by email
        const updatedCart = await cartService.updateQuantity(productId, quantity, user.email);
        setCartItems(updatedCart.items);
        toast.success('Cart updated');
      } else {
        toast.error('Please sign in to manage your cart');
      }
    } catch (error) {
      
      toast.error('Failed to update cart');
    }
  };

  const clearCart = async () => {
    // Prevent multiple simultaneous clear operations
    if (isClearing) {
      console.log('Cart clear already in progress, skipping...');
      return;
    }
    
    try {
      setIsClearing(true);
      console.log('Clearing cart...', { cartItems: cartItems.length, isAuthenticated, userEmail: user?.email });
      
      // Clear local state immediately
      setCartItems([]);
      
      // Clear all localStorage items
      localStorage.removeItem('cart');
      localStorage.removeItem('checkoutCartItems');
      localStorage.removeItem('checkoutFormData');
      localStorage.removeItem('appliedCoupon');
      localStorage.removeItem('checkoutAppliedCoupon');
      localStorage.removeItem('codUpfrontAmount');
      
      // Clear backend cart if authenticated (with timeout to prevent hanging)
      if (isAuthenticated && user && user.email) {
        try {
          // Add timeout to prevent hanging on 503 errors
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          );
          
          await Promise.race([
            cartService.clearCart(user.email),
            timeoutPromise
          ]);
          console.log('Backend cart cleared successfully');
        } catch (backendError) {
          console.error('Failed to clear backend cart:', backendError);
          // Don't show error to user as local cart is already cleared
        }
      }
      
      console.log('Cart cleared successfully');
      
      setTimeout(() => {
        setCartItems([]);
        console.log('Cart state force cleared again');
      }, 200);
      // Don't show success toast for automatic clearing after payment
      // toast.success('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Don't show error toast for automatic clearing
    } finally {
      setIsClearing(false);
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = item.product?.price || item.price;
      // Ensure price is a valid number, default to 0 if invalid
      const validPrice = (typeof price === 'number' && !isNaN(price)) ? price : 0;
      const quantity = (typeof item.quantity === 'number' && !isNaN(item.quantity)) ? item.quantity : 0;
      return total + (validPrice * quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Helper function to get the best available image for a cart item
  const getItemImage = (item) => {
    // If item has images array, use the first one
    if (item.images && item.images.length > 0) {
      return item.images[0];
    }
    // Otherwise use the single image field
    return item.product?.image || item.image || item.product?.images?.[0];
  };

  // Sync local cart with backend when user logs in
  useEffect(() => {
    const syncCart = async () => {
      if (isAuthenticated && user && user.email) {
        try {
          const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
          if (localCart.length > 0) {
            // Add each local item to backend cart
            for (const item of localCart) {
              await cartService.addToCart(item.id, item.quantity, user.email);
            }
            // Clear local cart
            localStorage.removeItem('cart');
            // Load updated cart from backend
            const cartData = await cartService.getCart(user.email);
            setCartItems(cartData.items || []);
          }
        } catch (error) {
          
        }
      }
    };
    syncCart();
  }, [isAuthenticated, user]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
        loading,
        getItemImage,
       
      }}
    >
      {children}
    </CartContext.Provider>
  );
};