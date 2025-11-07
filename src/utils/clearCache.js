/**
 * Utility function to clear all component caches
 * This helps ensure fresh data after payment or other state changes
 */

export const clearAllCaches = () => {
  // Clear MostLoved cache
  if (window.lovedProductsCache) {
    window.lovedProductsCache = null;
    window.lovedCacheTimestamp = null;
  }
  
  // Clear WeeklyBestsellers cache if it exists
  if (window.bestsellersCache) {
    window.bestsellersCache = null;
    window.bestsellersCacheTimestamp = null;
  }
  
  // Clear FeaturedProducts cache if it exists
  if (window.featuredProductsCache) {
    window.featuredProductsCache = null;
    window.featuredProductsCacheTimestamp = null;
  }
  
  // Clear Categories cache if it exists
  if (window.categoriesCache) {
    window.categoriesCache = null;
    window.categoriesCacheTimestamp = null;
  }
  
  console.log('All component caches cleared');
};

export const clearCheckoutData = () => {
  // Clear checkout-related localStorage data
  localStorage.removeItem('checkoutFormData');
  localStorage.removeItem('checkoutCartItems');
  localStorage.removeItem('appliedCoupon');
  localStorage.removeItem('checkoutAppliedCoupon');
  localStorage.removeItem('codUpfrontAmount');
  
  console.log('Checkout data cleared from localStorage');
};

export const clearAllData = () => {
  clearAllCaches();
  clearCheckoutData();
};
