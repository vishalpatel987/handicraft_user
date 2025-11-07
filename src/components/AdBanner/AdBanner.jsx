import { useState, useEffect, useRef, useCallback } from 'react';
import config from '../../config/config';

const AdBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Touch/swipe functionality
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const bannerRef = useRef(null);
  
  // Auto-slide functionality
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  // Fetch banners from API with caching
  const fetchBanners = async () => {
    // Check cache first
    const cacheKey = 'banners_cache';
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheKey + '_time');
    const now = Date.now();
    
    try {
      setLoading(true);
      
      // Always fetch fresh data from API (don't rely on cache for deleted banners)
      // Fetch banners from the hero-carousel API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout (increased)
      
      const response = await fetch(`${config.API_BASE_URL}/api/hero-carousel/active`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // If response is not ok, clear cache and show nothing
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(cacheKey + '_time');
        setBanners([]);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      // Transform hero-carousel data to banner format
      const transformedBanners = Array.isArray(data) ? data.map(item => ({
        banner: item.image,
        title: item.title || `Banner ${item._id}`,
        subtitle: item.subtitle || '',
        description: item.description || '',
        buttonText: item.buttonText || 'Shop Now',
        buttonLink: item.buttonLink || '/shop',
        isMobile: item.isMobile || false,
        order: item.order || 0
      })) : [];
      
      // Sort by order
      transformedBanners.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Limit to 5 banners for better performance
      const limitedBanners = transformedBanners.slice(0, 5);
      
      // Only set banners if we have data
      if (limitedBanners.length > 0) {
        setBanners(limitedBanners);
        
        // Cache the banners
        localStorage.setItem(cacheKey, JSON.stringify(limitedBanners));
        localStorage.setItem(cacheKey + '_time', now.toString());
        
        // Preload images for faster display
        limitedBanners.forEach((banner, index) => {
          if (banner.banner) {
            const img = new Image();
            img.src = banner.banner;
            img.onload = () => {
              console.log(`Banner ${index + 1} preloaded successfully`);
            };
          }
        });
      } else {
        // If API returns empty array, clear cache and hide banners
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(cacheKey + '_time');
        setBanners([]);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn('Banner fetch timeout');
        // On timeout, don't use cache - let it show nothing or use cached only if very recent
        if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 1 * 60 * 1000) {
          // Only use cache if less than 1 minute old on timeout
          const cachedBanners = JSON.parse(cachedData);
          setBanners(cachedBanners);
        } else {
          setBanners([]);
        }
      } else {
        console.error('Error fetching banners:', err);
        // On error, don't use old cache - clear it
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(cacheKey + '_time');
        setBanners([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
    
    // Refresh banners every 1 minute to get updates from admin (faster refresh)
    const refreshInterval = setInterval(() => {
      fetchBanners();
    }, 60000); // 1 minute
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Refresh banners when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchBanners();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto-slide function
  const startAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (banners.length > 1 && !isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
    }
  }, [banners.length, isPaused]);

  // Auto-rotate banner every 5 seconds (only if we have banners and not paused)
  useEffect(() => {
    startAutoSlide();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startAutoSlide]);

  // Reset auto-slide timer when user manually navigates
  const resetAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Restart auto-slide after a short delay
    setTimeout(() => {
      startAutoSlide();
    }, 1000);
  }, [startAutoSlide]);

  const handleDotClick = (index) => {
    setCurrentIndex(index);
    resetAutoSlide(); // Reset auto-slide timer when user manually navigates
  };

  // Touch/swipe handlers
  const minSwipeDistance = 50; // Minimum distance for a swipe

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && banners.length > 1) {
      // Swipe left - go to next banner
      setCurrentIndex((prev) => (prev + 1) % banners.length);
      resetAutoSlide(); // Reset auto-slide timer
    }
    if (isRightSwipe && banners.length > 1) {
      // Swipe right - go to previous banner
      setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
      resetAutoSlide(); // Reset auto-slide timer
    }
    
    setIsDragging(false);
  };

  // Mouse drag support for desktop
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setTouchStart(e.clientX);
    setTouchEnd(null);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setTouchEnd(e.clientX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    if (!touchStart || !touchEnd) {
      setIsDragging(false);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && banners.length > 1) {
      // Swipe left - go to next banner
      setCurrentIndex((prev) => (prev + 1) % banners.length);
      resetAutoSlide(); // Reset auto-slide timer
    }
    if (isRightSwipe && banners.length > 1) {
      // Swipe right - go to previous banner
      setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
      resetAutoSlide(); // Reset auto-slide timer
    }
    
    setIsDragging(false);
  };

  // Navigation buttons
  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    resetAutoSlide();
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    resetAutoSlide();
  };

  return (
    <div className="relative w-full mt-4 sm:mt-4 md:mt-6 px-4 sm:px-6 md:px-8 lg:px-12">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-3xl opacity-20 animate-pulse" />
      <div className="relative rounded-3xl overflow-hidden">
        {loading ? (
          <div className="w-full h-48 sm:h-56 md:h-80 lg:h-96 xl:h-[500px] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-3xl animate-pulse">
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-3 animate-bounce"></div>
                <p className="text-sm text-gray-500 font-medium">Loading banners...</p>
              </div>
            </div>
          </div>
        ) : banners.length === 0 ? (
          // Don't show anything if no banners - just return null to hide the component
          null
        ) : (
          <div 
            ref={bannerRef}
            className={`relative w-full h-48 sm:h-56 md:h-80 lg:h-96 xl:h-[500px] bg-gray-100 select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseEnter={() => setIsPaused(true)} // Pause auto-slide on hover
            onMouseLeave={() => {
              handleMouseUp(); // Handle mouse up
              setIsPaused(false); // Resume auto-slide when mouse leaves
            }}
            style={{ userSelect: 'none' }}
          >
            {/* Navigation Buttons */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevSlide();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-lg"
                  aria-label="Previous banner"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextSlide();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-lg"
                  aria-label="Next banner"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}

            {/* Banner Images */}
            {banners.map((banner, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentIndex ? 'opacity-100 z-0' : 'opacity-0 z-0'
                }`}
              >
                <img 
                  src={config.fixImageUrl(banner.banner)} 
                  alt={banner.title || `Banner ${index + 1}`} 
                  className="w-full h-full object-cover rounded-3xl shadow-2xl"
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                  loading={index === 0 ? 'eager' : 'lazy'} // First image loads immediately, others lazy load
                  decoding="async" // Non-blocking image decoding
                  onLoad={(e) => {
                    const img = e.target;
                    // Ensure image fills container completely
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    img.style.objectPosition = 'center';
                    // Add fade-in effect
                    img.style.opacity = '0';
                    img.style.transition = 'opacity 0.3s ease-in-out';
                    setTimeout(() => {
                      img.style.opacity = '1';
                    }, 50);
                  }}
                  onError={(e) => {
                    console.error('Banner image failed to load:', banner.banner);
                    // Show fallback instead of hiding
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJhbm5lciBJbWFnZTwvdGV4dD48L3N2Zz4=';
                  }}
                />
              </div>
            ))}
          </div>
        )}
        
        {/* Banner Indicators */}
        {!loading && banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-white w-8' : 'bg-white/50'
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdBanner;

