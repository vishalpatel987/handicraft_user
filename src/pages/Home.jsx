import React, { useEffect, useState } from 'react';
import AdBanner from '../components/AdBanner/AdBanner';
import Categories from '../components/Categories/Categories';
import WeeklyBestsellers from '../components/Products/WeeklyBestsellers';
import MostLoved from '../components/Products/MostLoved';
import Testimonials from '../components/Testimonials';
import Newsletter from '../components/Newsletter';
import { clearAllCaches } from '../utils/clearCache';

export default function Home() {
  const [retryCount, setRetryCount] = useState(0);
  
  // Clear any cached data when Home page loads
  useEffect(() => {
    // Clear component caches to ensure fresh data
    clearAllCaches();
    
    // Add a small delay to allow components to re-fetch data
    const timer = setTimeout(() => {
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [retryCount]);

  return (
    <div>
      <AdBanner />
      <Categories />
      <WeeklyBestsellers />
      <MostLoved />
      <Testimonials />
      <Newsletter />
    </div>
  );
} 