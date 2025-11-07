import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon, Star, Mail, MapPin, Phone } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import { trackCategoryVisit } from '../../services/userActivityService';
import env from '../../config/env';

const footerVariants = {
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

export default function Footer() {
  const { categories, loading, error } = useCategories();
  
  return (
    <footer 
      className="relative text-white w-full z-[10000] transition-all duration-500 shadow-2xl backdrop-blur-md"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(119, 42, 75, 0.95) 0%, rgba(143, 58, 97, 0.95) 50%, rgba(119, 42, 75, 0.95) 100%), url(/footer.png)",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black/20 pointer-events-none rounded-t-3xl" />
      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="container mx-auto px-6 py-6 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="mb-8">
                {/* Logo and Description Row */}
                <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
                  <img
                    src="/logo.png"
                    alt="Riko Craft"
                    className="h-16 md:h-20 w-auto drop-shadow-lg rounded-2xl bg-white/10 p-2"
                  />
                  <div className="flex-1">
                    <p className="text-gray-100 leading-relaxed text-base font-medium">
                      Riko Craft offers nature-powered handcrafted treasures crafted with pure artistry for timeless beauty in your home.
                    </p>
                  </div>
                </div>
                {/* Rating */}
                <div className="flex items-center space-x-3 mb-6">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-base text-gray-100 font-semibold">4.5/5</span>
                  <span className="text-base text-gray-200">Based on 374 reviews</span>
                </div>
                {/* Contact Details */}
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-white mb-4 tracking-wide">Contact Details</h4>
                  <div className="space-y-3">
                    
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-pink-400 flex-shrink-0" />
                      <div className="text-base text-gray-100">
                        <a href={`mailto:${env.CONTACT_EMAIL}`} className="hover:text-pink-400 transition-colors duration-200 font-medium">
                          {env.CONTACT_EMAIL}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-pink-400 flex-shrink-0" />
                      <div className="text-base text-gray-100 font-medium">
                        Jamshedpur, Jharkhand - 831004
                      </div>
                    </div>
                  </div>
                </div>
                {/* Social Media Links - Mobile Only */}
                <div className="flex items-center space-x-4 md:hidden mt-6">
                  <a href="https://www.facebook.com/share/1KsXm99uAE/?mibextid=wwXIfr" className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center hover:bg-pink-600 transition-all duration-200 group shadow-lg">
                    <FacebookIcon className="w-6 h-6 text-gray-100 group-hover:text-white" />
                  </a>
                  <a href="https://www.instagram.com/riko.craft?igsh=YWlsZmRnNmk5eXp2" className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center hover:bg-pink-600 transition-all duration-200 group shadow-lg">
                    <InstagramIcon className="w-6 h-6 text-gray-100 group-hover:text-white" />
                  </a>
                </div>
              </div>
            </div>
            {/* Popular Categories and Useful Links - Mobile View Side-by-Side */}
            <div className="md:hidden grid grid-cols-2 gap-6">
              {/* Popular Categories */}
              <div className="flex flex-col">
                <h4 className="text-lg font-bold text-white mb-4 tracking-wide">Popular Categories</h4>
                <ul className="space-y-2 flex-1">
                  {loading ? (
                    <li className="text-gray-300">Loading categories...</li>
                  ) : error ? (
                    <li className="text-gray-300">Categories unavailable</li>
                  ) : (
                    categories.map((category) => (
                      <li key={category._id || category.name}>
                        <div className="flex items-center justify-between">
                          <Link 
                            to={`/shop?category=${encodeURIComponent(category.name)}`}
                            className="text-gray-100 hover:text-pink-400 transition-colors duration-200 text-sm block py-1 font-medium flex-1"
                            onClick={() => {
                              // Track category visit
                              trackCategoryVisit(category._id || category.id, null);
                              
                              // Scroll to products section after navigation
                              setTimeout(() => {
                                const productsSection = document.getElementById('products-section');
                                if (productsSection) {
                                  productsSection.scrollIntoView({ 
                                    behavior: 'smooth', 
                                    block: 'start' 
                                  });
                                }
                              }, 100);
                            }}
                          >
                            {category.name}
                          </Link>
                          {category.subCategories && category.subCategories.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const subList = document.getElementById(`sub-${category._id || category.name}`);
                                const button = e.target;
                                if (subList) {
                                  const isHidden = subList.classList.contains('hidden');
                                  subList.classList.toggle('hidden');
                                  button.textContent = isHidden ? '▲' : '▼';
                                }
                              }}
                              className="text-gray-300 hover:text-pink-300 transition-colors duration-200 text-xs ml-2 w-4 h-4 flex items-center justify-center"
                            >
                              ▼
                            </button>
                          )}
                        </div>
                        {/* Sub-categories - Hidden by default */}
                        {category.subCategories && category.subCategories.length > 0 && (
                          <ul id={`sub-${category._id || category.name}`} className="ml-3 mt-1 space-y-1 hidden">
                            {category.subCategories.map((subCategory) => (
                              <li key={subCategory._id || subCategory.name}>
                                <Link 
                                  to={`/shop?category=${encodeURIComponent(category.name)}&subcategory=${encodeURIComponent(subCategory.name)}`}
                                  className="text-gray-300 hover:text-pink-300 transition-colors duration-200 text-sm block py-1 pl-2 border-l-2 border-gray-600 hover:border-pink-400"
                                  onClick={(e) => {
                                    console.log('Navigating to sub-category:', subCategory.name);
                                    // Track sub-category visit
                                    trackCategoryVisit(category._id || category.id, subCategory._id || subCategory.id);
                                    
                                    // Scroll to products section after navigation
                                    setTimeout(() => {
                                      const productsSection = document.getElementById('products-section');
                                      if (productsSection) {
                                        productsSection.scrollIntoView({ 
                                          behavior: 'smooth', 
                                          block: 'start' 
                                        });
                                      }
                                    }, 100);
                                  }}
                                >
                                  {subCategory.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </div>
              {/* Useful Links */}
              <div className="flex flex-col">
                <h4 className="text-lg font-bold text-white mb-4 tracking-wide">Useful Links</h4>
                <ul className="space-y-3 flex-1">
                  <li>
                    <Link to="/about" className="text-gray-100 hover:text-pink-400 transition-colors duration-200 text-base block py-1 font-medium">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-gray-100 hover:text-pink-400 transition-colors duration-200 text-base block py-1 font-medium">
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/policies" className="text-gray-100 hover:text-pink-400 transition-colors duration-200 text-base block py-1 font-medium">
                      Policies
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            {/* Popular Categories - Desktop */}
            <div className="hidden md:block">
              <h4 className="text-lg font-bold text-white mb-4 tracking-wide">Popular Categories</h4>
              <ul className="space-y-2">
                {loading ? (
                  <li className="text-gray-300">Loading categories...</li>
                ) : error ? (
                  <li className="text-gray-300">Categories unavailable</li>
                ) : (
                  categories.map((category) => (
                    <li key={category._id || category.name}>
                      <div className="flex items-center justify-between">
                        <Link 
                          to={`/shop?category=${encodeURIComponent(category.name)}`}
                          className="text-gray-100 hover:text-pink-400 transition-colors duration-200 text-base block py-1 font-medium flex-1"
                          onClick={() => {
                            // Scroll to products section after navigation
                            setTimeout(() => {
                              const productsSection = document.getElementById('products-section');
                              if (productsSection) {
                                productsSection.scrollIntoView({ 
                                  behavior: 'smooth', 
                                  block: 'start' 
                                });
                              }
                            }, 100);
                          }}
                        >
                          {category.name}
                        </Link>
                        {category.subCategories && category.subCategories.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const subList = document.getElementById(`sub-desktop-${category._id || category.name}`);
                              const button = e.target;
                              if (subList) {
                                const isHidden = subList.classList.contains('hidden');
                                subList.classList.toggle('hidden');
                                button.textContent = isHidden ? '▲' : '▼';
                              }
                            }}
                            className="text-gray-300 hover:text-pink-300 transition-colors duration-200 text-sm ml-2 w-5 h-5 flex items-center justify-center"
                          >
                            ▼
                          </button>
                        )}
                      </div>
                      {/* Sub-categories - Hidden by default */}
                      {category.subCategories && category.subCategories.length > 0 && (
                        <ul id={`sub-desktop-${category._id || category.name}`} className="ml-4 mt-1 space-y-1 hidden">
                          {category.subCategories.map((subCategory) => (
                            <li key={subCategory._id || subCategory.name}>
                              <Link 
                                to={`/shop?category=${encodeURIComponent(category.name)}&subcategory=${encodeURIComponent(subCategory.name)}`}
                                className="text-gray-300 hover:text-pink-300 transition-colors duration-200 text-sm block py-1 pl-3 border-l-2 border-gray-600 hover:border-pink-400"
                                onClick={(e) => {
                                  console.log('Navigating to sub-category:', subCategory.name);
                                  // Scroll to products section after navigation
                                  setTimeout(() => {
                                    const productsSection = document.getElementById('products-section');
                                    if (productsSection) {
                                      productsSection.scrollIntoView({ 
                                        behavior: 'smooth', 
                                        block: 'start' 
                                      });
                                    }
                                  }, 100);
                                }}
                              >
                                {subCategory.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
            {/* Useful Links - Desktop */}
            <div className="hidden md:block">
              <h4 className="text-lg font-bold text-white mb-4 tracking-wide">Useful Links</h4>
              <ul className="space-y-3">
              
                <li>
                  <Link to="/about" className="text-gray-100 hover:text-pink-400 transition-colors duration-200 text-base block py-1 font-medium">
                    About Us
                  </Link>
                </li>
              
                <li>
                  <Link to="/contact" className="text-gray-100 hover:text-pink-400 transition-colors duration-200 text-base block py-1 font-medium">
                    Contact Us
                  </Link>
                </li>
              
                
                <li>
                  <Link to="/policies" className="text-gray-100 hover:text-pink-400 transition-colors duration-200 text-base block py-1 font-medium">
                    Policies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          {/* Bottom Bar */}
          <div className="border-t border-white mt-4 pt-3 pb-20 md:pb-2">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
              <div className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-4">
                <p className="text-sm text-gray-200 text-center md:text-left font-medium">
                  © 2025 All Rights Reserved by Riko Enterpreise.
                </p>
                <p className="text-xs text-gray-300 text-center md:text-left">
                  Made by <a href="https://www.appzeto.com/" target="_blank" rel="noopener noreferrer" className="font-medium text-pink-300 hover:text-pink-200 transition-colors duration-200">Appzeto</a>
                </p>
              </div>
              {/* Social Media Links - Desktop Only */}
              <div className="hidden md:flex items-center space-x-3">
                <a href="https://www.facebook.com/share/1KsXm99uAE/?mibextid=wwXIfr" className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-pink-600 transition-all duration-200 group shadow-lg">
                  <FacebookIcon className="w-5 h-5 text-gray-100 group-hover:text-white" />
                </a>
                <a href="https://www.instagram.com/riko.craft?igsh=YWlsZmRnNmk5eXp2" className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-pink-600 transition-all duration-200 group shadow-lg">
                  <InstagramIcon className="w-5 h-5 text-gray-100 group-hover:text-white" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
