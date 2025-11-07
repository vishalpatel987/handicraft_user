import { useState, useEffect } from 'react';
import config from '../config/config';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        // Try to fetch hierarchy first (includes sub-categories)
        const hierarchyResponse = await fetch(`${config.API_BASE_URL}/api/categories/hierarchy`);
        
        if (hierarchyResponse.ok) {
          const hierarchyData = await hierarchyResponse.json();
          const categoriesWithSubs = hierarchyData.categories || [];
          console.log('Fetched categories with sub-categories:', categoriesWithSubs);
          setCategories(categoriesWithSubs);
        } else {
          // Fallback to main categories
          const response = await fetch(`${config.API_BASE_URL}/api/categories/main`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch categories');
          }
          
          const data = await response.json();
          setCategories(data.mainCategories || []);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err.message);
        // Fallback to static categories if API fails
        setCategories([
          { name: "Dressers & Wardrobes", subCategories: [
            { name: "Wooden Wardrobes" },
            { name: "Metal Wardrobes" },
            { name: "Storage Solutions" }
          ]},
          { name: "Seatings", subCategories: [
            { name: "Chairs" },
            { name: "Sofas" },
            { name: "Stools" }
          ]},
          { name: "Sleep & Rest Furniture", subCategories: [
            { name: "Beds" },
            { name: "Mattresses" },
            { name: "Bedside Tables" }
          ]},
          { name: "Storage & Shelving", subCategories: [
            { name: "Bookshelves" },
            { name: "Storage Boxes" },
            { name: "Wall Shelves" }
          ]},
          { name: "Table & Chair Sets", subCategories: [
            { name: "Dining Sets" },
            { name: "Study Tables" },
            { name: "Coffee Tables" }
          ]},
          { name: "Wooden Craft", subCategories: [
            { name: "Decorative Items" },
            { name: "Kitchen Items" },
            { name: "Wall Art" }
          ]},
          { name: "Handmade Jewellery", subCategories: [
            { name: "Necklaces" },
            { name: "Earrings" },
            { name: "Bracelets" }
          ]}
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};
