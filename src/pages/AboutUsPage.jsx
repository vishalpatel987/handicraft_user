import React, { useState, useEffect } from 'react';
import axios from 'axios';
import env from '../config/env';
import SEO from '../components/SEO/SEO';

const AboutUsPage = () => {
  const [content, setContent] = useState({ heading: '', content: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAboutUs();
  }, []);

  const fetchAboutUs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${env.API_BASE_URL}/api/data-page/about`);
      setContent(response.data);
    } catch (error) {
      console.error('Error fetching About Us:', error);
      setContent({
        heading: 'About Us',
        content: 'Welcome to RikoCraft. We are passionate about bringing you quality handcrafted products.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="About Us - RikoCraft"
        description="Learn more about RikoCraft and our mission to bring quality handcrafted products"
        url={`${env.FRONTEND_URL}/about`}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 text-center">
              {content.heading}
            </h1>
            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {content.content}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutUsPage;

//aa