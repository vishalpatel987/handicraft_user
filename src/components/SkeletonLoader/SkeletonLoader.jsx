import React from 'react';

// Skeleton loader for product cards
export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden animate-pulse">
    {/* Image skeleton */}
    <div className="aspect-square bg-gray-200"></div>
    
    {/* Content skeleton */}
    <div className="p-3 space-y-2">
      {/* Title skeleton */}
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      
      {/* Category skeleton */}
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      
      {/* Price skeleton */}
      <div className="flex items-center space-x-2">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
        <div className="h-3 bg-gray-200 rounded w-12"></div>
      </div>
      
      {/* Button skeleton */}
      <div className="h-8 bg-gray-200 rounded"></div>
    </div>
  </div>
);

// Skeleton loader for category cards
export const CategoryCardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 aspect-square overflow-hidden animate-pulse">
    <div className="w-full h-full bg-gray-200"></div>
  </div>
);

// Skeleton loader for product grid
export const ProductGridSkeleton = ({ count = 8, isMobile = false }) => {
  const gridCols = isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
  
  return (
    <div className={`grid ${gridCols} gap-3 md:gap-6`}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

// Skeleton loader for category grid
export const CategoryGridSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8">
    {Array.from({ length: count }).map((_, index) => (
      <CategoryCardSkeleton key={index} />
    ))}
  </div>
);

// Skeleton loader for page content
export const PageSkeleton = () => (
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 lg:py-12">
    {/* Header skeleton */}
    <div className="text-center mb-8 md:mb-10 animate-pulse">
      <div className="h-8 md:h-12 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-4"></div>
      <div className="h-0.5 bg-gray-200 w-16 mx-auto"></div>
    </div>
    
    {/* Content skeleton */}
    <div className="space-y-8">
      <ProductGridSkeleton count={8} />
    </div>
  </div>
);

// Skeleton loader for shop page filters
export const ShopFiltersSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
    <div className="space-y-6">
      {/* Filter title */}
      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
      
      {/* Filter options */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Skeleton loader for product details
export const ProductDetailsSkeleton = () => (
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 animate-pulse">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Image skeleton */}
      <div className="space-y-4">
        <div className="aspect-square bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="aspect-square bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
      
      {/* Details skeleton */}
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
        
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
        
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

// Skeleton loader for navigation
export const NavigationSkeleton = () => (
  <div className="bg-white shadow-sm border-b border-gray-200 animate-pulse">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="h-8 bg-gray-200 rounded w-32"></div>
        <div className="hidden md:flex space-x-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-4 bg-gray-200 rounded w-16"></div>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

// Main skeleton loader component
const SkeletonLoader = ({ 
  type = 'product-grid', 
  count = 8, 
  isMobile = false,
  className = '' 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'product-grid':
        return <ProductGridSkeleton count={count} isMobile={isMobile} />;
      case 'category-grid':
        return <CategoryGridSkeleton count={count} />;
      case 'page':
        return <PageSkeleton />;
      case 'shop-filters':
        return <ShopFiltersSkeleton />;
      case 'product-details':
        return <ProductDetailsSkeleton />;
      case 'navigation':
        return <NavigationSkeleton />;
      case 'product-card':
        return <ProductCardSkeleton />;
      case 'category-card':
        return <CategoryCardSkeleton />;
      default:
        return <ProductGridSkeleton count={count} isMobile={isMobile} />;
    }
  };

  return (
    <div className={className}>
      {renderSkeleton()}
    </div>
  );
};

export default SkeletonLoader;
