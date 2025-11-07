// SEO Configuration for Riko Craft
import env from './env';

export const seoConfig = {
  home: {
    title: "Riko Craft - Handcrafted Jewelry & Artisan Products | Premium Handmade Items",
    description: "Discover unique handcrafted jewelry and artisan products at Riko Craft. Premium handmade items, custom designs, and authentic craftsmanship. Shop the finest collection of Eastern Heritage jewelry and handcrafted goods.",
    keywords: "handcrafted jewelry, artisan products, handmade items, custom jewelry, Eastern Heritage, handcrafted goods, premium jewelry, unique designs, artisan crafts, handmade accessories",
    url: `${env.FRONTEND_URL}/`,
    image: "/logo.png",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Riko Craft",
      "url": env.FRONTEND_URL,
      "description": "Premium handcrafted jewelry and artisan products",
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${env.FRONTEND_URL}/shop?search={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    }
  },
  
  shop: {
    title: "Shop Handcrafted Jewelry & Artisan Products | Riko Craft",
    description: "Browse our curated collection of handcrafted jewelry and artisan products. Find unique handmade items, custom designs, and premium Eastern Heritage jewelry at Riko Craft.",
    keywords: "shop jewelry, handcrafted products, artisan goods, handmade jewelry, custom designs, Eastern Heritage, premium jewelry, unique accessories",
    url: `${env.FRONTEND_URL}/shop`,
    image: "/logo.png",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Riko Craft Shop",
      "description": "Handcrafted jewelry and artisan products",
      "url": `${env.FRONTEND_URL}/shop`
    }
  },
  
  about: {
    title: "About Riko Craft - Our Story & Mission | Handcrafted Excellence",
    description: "Learn about Riko Craft's mission to preserve Eastern Heritage through handcrafted jewelry and artisan products. Discover our story, values, and commitment to authentic craftsmanship.",
    keywords: "about Riko Craft, our story, mission, Eastern Heritage, handcrafted excellence, artisan values, craftsmanship",
    url: `${env.FRONTEND_URL}/about`,
    image: "/mission.jpg",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About Riko Craft",
      "description": "Our story and mission to preserve Eastern Heritage through handcrafted jewelry"
    }
  },
  
  contact: {
    title: "Contact Riko Craft - Get in Touch | Customer Support",
    description: "Contact Riko Craft for customer support, product inquiries, or collaboration opportunities. We're here to help with your handcrafted jewelry and artisan product needs.",
    keywords: "contact Riko Craft, customer support, product inquiries, collaboration, handcrafted jewelry support",
    url: `${env.FRONTEND_URL}/contact`,
    image: "/logo.png",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact Riko Craft",
      "description": "Get in touch with Riko Craft for support and inquiries"
    }
  },
  
  product: (product) => ({
    title: `${product.name} - Handcrafted Jewelry | Riko Craft`,
    description: product.description || `Discover this unique handcrafted ${product.name} at Riko Craft. Premium quality, authentic craftsmanship, and exclusive design.`,
    keywords: `${product.name}, handcrafted jewelry, artisan product, custom design, Eastern Heritage, premium quality, unique jewelry`,
    url: `${env.FRONTEND_URL}/product/${product.id}`,
    image: product.images?.[0] || "/logo.png",
    type: "product",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "description": product.description || `Handcrafted ${product.name}`,
      "image": product.images || ["/logo.png"],
      "brand": {
        "@type": "Brand",
        "name": "Riko Craft"
      },
      "offers": {
        "@type": "Offer",
        "price": product.price,
        "priceCurrency": "INR",
        "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "url": `${env.FRONTEND_URL}/product/${product.id}`
      }
    }
  }),
  
  login: {
    title: "Login to Riko Craft | Access Your Account",
    description: "Login to your Riko Craft account to manage orders, track purchases, and access exclusive handcrafted jewelry and artisan products.",
    keywords: "login, Riko Craft account, user login, customer account, order management",
    url: `${env.FRONTEND_URL}/login`,
    image: "/logo.png"
  },
  
  signup: {
    title: "Sign Up for Riko Craft | Create Your Account",
    description: "Join Riko Craft to access exclusive handcrafted jewelry and artisan products. Create your account for personalized shopping experience and order tracking.",
    keywords: "sign up, create account, Riko Craft membership, join us, personalized shopping",
    url: `${env.FRONTEND_URL}/signup`,
    image: "/logo.png"
  },
  
  policies: {
    title: "Policies & Terms | Riko Craft",
    description: "Read Riko Craft's policies, terms of service, privacy policy, and shipping information. Understand our commitment to quality and customer satisfaction.",
    keywords: "policies, terms of service, privacy policy, shipping policy, return policy, Riko Craft policies",
    url: `${env.FRONTEND_URL}/policies`,
    image: "/logo.png"
  },
  
};

// Default SEO fallback
export const defaultSEO = {
  title: "Riko Craft - Handcrafted Jewelry & Artisan Products",
  description: "Discover unique handcrafted jewelry and artisan products at Riko Craft. Premium handmade items, custom designs, and authentic craftsmanship.",
  keywords: "handcrafted jewelry, artisan products, handmade items, Eastern Heritage",
  url: env.FRONTEND_URL,
  image: "/logo.png"
}; 