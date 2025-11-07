// Data Cache Service for optimizing API calls and reducing loading times
class DataCacheService {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
    this.maxCacheSize = 50; // Maximum number of cached items
  }

  // Generate cache key from URL and params
  generateKey(url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    return `${url}_${JSON.stringify(sortedParams)}`;
  }

  // Check if cache entry is valid
  isValid(key) {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;
    
    const ttl = this.getTTL(key);
    return Date.now() - timestamp < ttl;
  }

  // Get TTL for specific cache key
  getTTL(key) {
    // Different TTL for different data types
    if (key.includes('/categories')) return 10 * 60 * 1000; // 10 minutes for categories
    if (key.includes('/products')) return 3 * 60 * 1000; // 3 minutes for products
    if (key.includes('/shop')) return 2 * 60 * 1000; // 2 minutes for shop data
    return this.defaultTTL;
  }

  // Get data from cache
  get(key) {
    if (this.isValid(key)) {
      console.log(`📦 Cache HIT: ${key}`);
      return this.cache.get(key);
    }
    
    if (this.cache.has(key)) {
      console.log(`📦 Cache EXPIRED: ${key}`);
      this.delete(key);
    }
    
    return null;
  }

  // Set data in cache
  set(key, data, customTTL = null) {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanup();
    }

    this.cache.set(key, data);
    this.cacheTimestamps.set(key, Date.now());
    
    if (customTTL) {
      // Store custom TTL
      this.cacheTimestamps.set(`${key}_ttl`, customTTL);
    }
    
    console.log(`📦 Cache SET: ${key}`);
  }

  // Delete specific cache entry
  delete(key) {
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
    this.cacheTimestamps.delete(`${key}_ttl`);
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      if (key.endsWith('_ttl')) continue; // Skip TTL entries
      
      const ttl = this.getTTL(key);
      if (now - timestamp > ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    console.log(`📦 Cache CLEANUP: Removed ${keysToDelete.length} expired entries`);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.cacheTimestamps.clear();
    console.log('📦 Cache CLEARED');
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      timestamps: Object.fromEntries(this.cacheTimestamps)
    };
  }

  // Preload data for better navigation
  async preload(url, params = {}) {
    const key = this.generateKey(url, params);
    
    if (this.isValid(key)) {
      return this.get(key);
    }

    try {
      console.log(`📦 Preloading: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.set(key, data);
      return data;
    } catch (error) {
      console.error(`📦 Preload failed for ${url}:`, error);
      return null;
    }
  }

  // Batch preload multiple URLs
  async batchPreload(urls) {
    const promises = urls.map(({ url, params = {} }) => 
      this.preload(url, params)
    );
    
    try {
      const results = await Promise.allSettled(promises);
      console.log(`📦 Batch preload completed: ${results.length} requests`);
      return results;
    } catch (error) {
      console.error('📦 Batch preload failed:', error);
      return [];
    }
  }
}

// Create singleton instance
const dataCacheService = new DataCacheService();

// Enhanced fetch function with caching
export const cachedFetch = async (url, options = {}) => {
  const { params = {}, useCache = true, ttl = null } = options;
  const key = dataCacheService.generateKey(url, params);

  // Try to get from cache first
  if (useCache) {
    const cachedData = dataCacheService.get(key);
    if (cachedData) {
      return cachedData;
    }
  }

  try {
    console.log(`🌐 API CALL: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the response
    if (useCache) {
      dataCacheService.set(key, data, ttl);
    }

    return data;
  } catch (error) {
    console.error(`🌐 API ERROR: ${url}`, error);
    throw error;
  }
};

// Parallel fetch function for multiple requests
export const parallelFetch = async (requests) => {
  const promises = requests.map(({ url, params = {}, options = {} }) => 
    cachedFetch(url, { params, ...options })
  );

  try {
    const results = await Promise.allSettled(promises);
    return results.map((result, index) => ({
      url: requests[index].url,
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null,
    }));
  } catch (error) {
    console.error('🌐 Parallel fetch failed:', error);
    return [];
  }
};

// Preload common data for better navigation
export const preloadCommonData = async (config) => {
  const commonUrls = [
    { url: config.API_URLS.SHOP },
    { url: `${config.API_URLS.CATEGORIES}/hierarchy` },
  ];

  return dataCacheService.batchPreload(commonUrls);
};

// Clear cache on user logout
export const clearUserCache = () => {
  dataCacheService.clear();
};

export default dataCacheService;
